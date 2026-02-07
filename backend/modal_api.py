from modal_app import app, image, volume
from pose.inference import SAM3DBodyInference
from pose_embed.inference import PoseEmbedding
from clip.clipModel import Clip
import modal
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from typing import Dict, Any, Tuple, List
from pathlib import Path
import json

# --- HELPER (CPU) ---


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """
    Compute cosine similarity between two vectors.

    Args:
        a: First vector as numpy array
        b: Second vector as numpy array

    Returns:
        Cosine similarity score between -1 and 1
    """
    # Handle zero vectors
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    # Compute cosine similarity
    return float(np.dot(a, b) / (norm_a * norm_b))


def load_embeddings_json(json_path: Path) -> Dict[str, Dict[str, List[float]]]:
    """
    Load embeddings JSON file.

    Args:
        json_path: Path to the embeddings JSON file

    Returns:
        Dictionary mapping relative paths to embeddings:
        {relative_path: {"pose_embedding": [...], "clip_embedding": [...]}}

    Raises:
        FileNotFoundError: If JSON file doesn't exist
        ValueError: If JSON structure is invalid
    """
    if not json_path.exists():
        raise FileNotFoundError(f"Embeddings file not found: {json_path}")

    with open(json_path, "r") as f:
        data = json.load(f)

    if "embeddings" not in data:
        raise ValueError("Invalid embeddings JSON structure: missing 'embeddings' key")

    return data["embeddings"]


def load_image_from_path(relative_path: str, base_dir: Path) -> bytes:
    """
    Load image file from relative path and return as bytes.

    Args:
        relative_path: Relative path from downloaded_pins directory (e.g., "pose-reference/image.jpg")
        base_dir: Base directory (backend directory)

    Returns:
        Image file as bytes

    Raises:
        FileNotFoundError: If image file doesn't exist
    """
    image_path = base_dir / "data" / "downloaded_pins" / relative_path

    if not image_path.exists():
        raise FileNotFoundError(f"Image file not found: {image_path}")

    return image_path.read_bytes()


def parse_image(image_data: str | bytes | np.ndarray) -> Tuple[np.ndarray, Tuple[int, int]]:
    """
    Parses image data into a numpy array.
    This is pure CPU logic, so we keep it as a plain Python function.
    """
    if isinstance(image_data, np.ndarray):
        return image_data, image_data.shape[:2]

    if isinstance(image_data, str):
        image_bytes = base64.b64decode(image_data)
    else:
        image_bytes = image_data

    pil_image = Image.open(BytesIO(image_bytes))
    if pil_image.mode != "RGB":
        pil_image = pil_image.convert("RGB")

    img_array = np.array(pil_image)
    return img_array, img_array.shape[:2]


# --- 1. THE ORCHESTRATOR (CPU ONLY) ---
# REMOVED: gpu="T4". This function just routes traffic, so keep it cheap (CPU).
@app.function(image=image)
def run_pose_pipeline(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Orchestrates the pipeline:
    1. Parse Image (CPU)
    2. Send to Pose Estimator (GPU Container A)
    3. Send to Embedder (GPU/CPU Container B)
    """
    image_data = data.get("image")
    if image_data is None:
        return {"success": False, "error": "No image provided"}

    try:
        img_array, img_shape = parse_image(image_data)
    except Exception as e:
        return {"success": False, "error": f"Image decode failed: {e}"}

    use_bbox_detector = data.get("use_bbox_detector", True)

    # --- STEP 1: Get Pose (Remote Call) ---
    # We instantiate the class here to get a handle, then call .remote()
    # This sends the heavy array to the GPU worker.
    try:
        model = SAM3DBodyInference()
        pose_dict = model.predict_2d_pose.remote(
            image=img_array,
            use_bbox_detector=use_bbox_detector,
        )
    except Exception as e:
        return {"success": False, "error": f"Pose inference failed: {e}"}

    if not pose_dict:
        return {"success": False, "error": "No person detected"}

    # --- STEP 2: Get Embedding (Remote Call) ---
    try:
        embedder = PoseEmbedding()
        embedding = embedder.extract_embedding.remote(
            pose_dict=pose_dict,
            img_shape=img_shape,
        )
    except Exception as e:
        return {"success": False, "error": f"Embedding failed: {e}"}

    # Success!
    return {
        "success": True,
        "embedding": embedding,  # Note: Numpy array (needs list conversion for JSON)
        "pose": pose_dict,
        "img_shape": img_shape,
        "error": None,
    }


# --- 2. THE WEB ENDPOINT ---
# Use `web_endpoint` for standard JSON APIs.
@app.function(image=image)
@modal.web_endpoint(method="POST")
def image_to_pose_embedding(data: Dict[str, Any]):
    """
    Public API Endpoint.
    Receives JSON -> Calls Orchestrator -> Returns JSON.
    """
    # .local() runs the orchestrator in THIS container (CPU), saving a cold boot.
    result = run_pose_pipeline.local(data)

    # JSON Serialization: Convert numpy arrays to lists
    if result.get("embedding") is not None:
        result["embedding"] = result["embedding"].tolist()

    # Optional: Clean up other numpy types if necessary
    if result.get("img_shape"):
        result["img_shape"] = list(result["img_shape"])

    return result


# --- 3. CLIP TEXT EMBEDDING ---
@app.function(image=image)
@modal.web_endpoint(method="POST")
def text_to_clip_embedding(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Public API Endpoint for CLIP text embeddings.

    Args:
        data: Dictionary containing:
            - "text": Text string or list of text strings
            - "normalize": Optional bool (default False) to normalize embeddings

    Returns:
        Dictionary with:
            - "embedding": List of floats (the text embedding vector(s))
            - "success": Boolean indicating success
            - "error": Optional error message
    """
    text = data.get("text")
    if text is None:
        return {"success": False, "error": "No text provided", "embedding": None}

    normalize = data.get("normalize", False)

    try:
        clip_model = Clip()
        embedding = clip_model.encode_text.remote(texts=text, normalize=normalize)

        # Convert to list for JSON serialization
        if embedding.ndim == 1:
            embedding = embedding.tolist()
        else:
            embedding = embedding.tolist()

        return {
            "success": True,
            "embedding": embedding,
            "error": None,
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Text embedding failed: {str(e)}",
            "embedding": None,
        }


# --- 4. CLIP IMAGE EMBEDDING ---
@app.function(image=image)
@modal.web_endpoint(method="POST")
def image_to_clip_embedding(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Public API Endpoint for CLIP image embeddings.

    Args:
        data: Dictionary containing:
            - "image": Base64 encoded image string, image bytes, or numpy array
            - "normalize": Optional bool (default False) to normalize embeddings

    Returns:
        Dictionary with:
            - "embedding": List of floats (the image embedding vector)
            - "success": Boolean indicating success
            - "error": Optional error message
    """
    image_data = data.get("image")
    if image_data is None:
        return {"success": False, "error": "No image provided", "embedding": None}

    normalize = data.get("normalize", False)

    try:
        # Parse image
        img_array, img_shape = parse_image(image_data)

        # Encode image
        clip_model = Clip()
        embedding = clip_model.encode_image.remote(image=img_array, normalize=normalize)

        # Convert to list for JSON serialization
        embedding_list = embedding.tolist()

        return {
            "success": True,
            "embedding": embedding_list,
            "img_shape": list(img_shape),
            "error": None,
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Image embedding failed: {str(e)}",
            "embedding": None,
        }


# --- 5. SKETCH-TO-PINTEREST SEARCH ---
@app.function(image=image, volumes={"/root/data": volume})
@modal.web_endpoint(method="POST")
def search_similar_images(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Search for similar Pinterest images using hybrid pose + CLIP similarity.

    Args:
        data: Dictionary containing:
            - "sketch": Base64 encoded image string, image bytes, or numpy array
            - "text": Text query string
            - "k": Number of top results to return (default: 10)
            - "lambda": Smoothing factor for hybrid score (default: 0.5, range: 0-1)

    Returns:
        Dictionary with:
            - "success": Boolean indicating success
            - "results": List of dicts with {"path": relative_path, "image": base64_string, "score": closeness_score}
            - "error": Optional error message
    """
    # Extract and validate inputs
    sketch_data = data.get("sketch")
    text = data.get("text")
    k = data.get("k", 10)
    lambda_param = data.get("lambda", 0.5)

    if sketch_data is None:
        return {"success": False, "error": "No sketch image provided", "results": []}

    if text is None or not isinstance(text, str) or not text.strip():
        return {"success": False, "error": "No text query provided", "results": []}

    # Clamp lambda to [0, 1]
    lambda_param = max(0.0, min(1.0, float(lambda_param)))

    # Clamp k to reasonable range
    k = max(1, min(int(k), 100))

    try:
        # Step 1: Extract query embeddings
        # Parse sketch image
        sketch_array, sketch_shape = parse_image(sketch_data)

        # Get pose embedding (P_A)
        try:
            pose_model = SAM3DBodyInference()
            pose_dict = pose_model.predict_2d_pose.remote(
                image=sketch_array,
                use_bbox_detector=True,
            )

            if not pose_dict:
                return {
                    "success": False,
                    "error": "No person detected in sketch image",
                    "results": [],
                }

            pose_embedder = PoseEmbedding()
            P_A = pose_embedder.extract_embedding.remote(
                pose_dict=pose_dict,
                img_shape=sketch_shape,
            )
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to extract pose embedding: {str(e)}",
                "results": [],
            }

        # Get CLIP text embedding (C_A)
        try:
            clip_model = Clip()
            C_A = clip_model.encode_text.remote(texts=text, normalize=False)
            # If multiple texts, take first
            if len(C_A.shape) > 1:
                C_A = C_A[0]
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to extract CLIP text embedding: {str(e)}",
                "results": [],
            }

        # Step 2: Load Pinterest embeddings
        backend_dir = Path(__file__).parent
        embeddings_json_path = backend_dir / "data" / "embeddings.json"

        try:
            embeddings_map = load_embeddings_json(embeddings_json_path)
        except FileNotFoundError:
            return {
                "success": False,
                "error": f"Embeddings file not found: {embeddings_json_path}",
                "results": [],
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to load embeddings: {str(e)}",
                "results": [],
            }

        if not embeddings_map:
            return {
                "success": False,
                "error": "Embeddings file is empty",
                "results": [],
            }

        # Step 3: Compute similarity scores
        scores = []
        P_A_np = np.array(P_A, dtype=np.float32)
        C_A_np = np.array(C_A, dtype=np.float32)

        for relative_path, embeddings in embeddings_map.items():
            try:
                # Extract P_B and C_B
                if "pose_embedding" not in embeddings or "clip_embedding" not in embeddings:
                    continue

                P_B = np.array(embeddings["pose_embedding"], dtype=np.float32)
                C_B = np.array(embeddings["clip_embedding"], dtype=np.float32)

                # Compute cosine similarities
                pose_sim = cosine_similarity(P_A_np, P_B)
                clip_sim = cosine_similarity(C_A_np, C_B)

                # Compute closeness score
                closeness_score = lambda_param * pose_sim + (1 - lambda_param) * clip_sim

                scores.append((relative_path, closeness_score))
            except Exception:
                # Skip this image if there's an error
                continue

        if not scores:
            return {
                "success": False,
                "error": "No valid embeddings found in database",
                "results": [],
            }

        # Step 4: Rank and select top k
        scores.sort(key=lambda x: x[1], reverse=True)
        top_k = scores[:k]

        # Step 5: Load and encode images
        results = []
        for relative_path, score in top_k:
            try:
                image_bytes = load_image_from_path(relative_path, backend_dir)
                image_base64 = base64.b64encode(image_bytes).decode("utf-8")

                results.append({
                    "path": relative_path,
                    "image": image_base64,
                    "score": float(score),
                })
            except FileNotFoundError:
                # Skip if image file is missing
                continue
            except Exception:
                # Skip on other errors
                continue

        if not results:
            return {
                "success": False,
                "error": "Failed to load any image files for top results",
                "results": [],
            }

        # Step 6: Return results
        return {
            "success": True,
            "results": results,
            "error": None,
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "results": [],
        }


# --- 6. INTERNAL TEST SUITE ---
@app.local_entrypoint()
def main():
    print("🚀 Starting Pipeline Test Suite...")
    print("=" * 60)

    # Load image from pinterest files
    backend_dir = Path(__file__).parent
    image_path = backend_dir / "data" / "downloaded_pins" / \
        "pose-reference" / "676665912761318991.jpg"

    if not image_path.exists():
        print(f"❌ Image not found: {image_path}")
        print("   Falling back to dummy image...")
        dummy_img = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    else:
        print(f"📷 Loading image: {image_path.relative_to(backend_dir)}")
        pil_image = Image.open(image_path)
        if pil_image.mode != "RGB":
            pil_image = pil_image.convert("RGB")
        dummy_img = np.array(pil_image)
        print(f"   Image shape: {dummy_img.shape}")

    # # Test 1: Pose Pipeline
    # print("\n" + "-" * 60)
    # print("[Test 1] Testing Pose Pipeline")
    # print("-" * 60)
    # print("📡 Invoking run_pose_pipeline.remote()...")

    # try:
    #     ret = run_pose_pipeline.remote({"image": dummy_img})
    #     if ret["success"]:
    #         print(f"✅ Success! Embedding Size: {len(ret['embedding'])}")
    #         print(f"   Joints detected: {len(ret.get('pose', {}))}")
    #     else:
    #         print(f"❌ Error: {ret['error']}")
    # except Exception as e:
    #     print(f"❌ Exception: {e}")

    # Test 2: CLIP Text Embedding
    print("\n" + "-" * 60)
    print("[Test 2] Testing CLIP Text Embedding")
    print("-" * 60)

    test_texts = [
        "a person doing yoga",
        "someone running",
        "a person standing"
    ]

    try:
        clip_model = Clip()
        print(f"📡 Encoding {len(test_texts)} text(s)...")
        embeddings = clip_model.encode_text.remote(texts=test_texts, normalize=False)

        print("✅ Success!")
        print(f"   Input texts: {len(test_texts)}")
        print(f"   Embedding shape: {embeddings.shape}")
        print(f"   Embedding dimension: {embeddings.shape[1]}")
        print(f"   Sample embedding (first text, first 5 dims): {embeddings[0][:5]}")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

    # Test 3: CLIP Image Embedding
    print("\n" + "-" * 60)
    print("[Test 3] Testing CLIP Image Embedding")
    print("-" * 60)

    try:
        clip_model = Clip()
        print(f"📡 Encoding image (shape: {dummy_img.shape})...")
        embedding = clip_model.encode_image.remote(image=dummy_img, normalize=False)

        print("✅ Success!")
        print(f"   Embedding shape: {embedding.shape}")
        print(f"   Embedding dimension: {embedding.shape[0]}")
        print(f"   Sample embedding (first 5 dims): {embedding[:5]}")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

    print("\n" + "=" * 60)
    print("Test Suite Complete!")
    print("=" * 60)
