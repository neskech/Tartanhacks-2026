from modal_app import app, image
from pose.inference import SAM3DBodyInference
from pose_embed.inference import PoseEmbedding
import modal
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from typing import Dict, Any, Tuple
from pathlib import Path

# --- HELPER (CPU) ---


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


# --- 3. INTERNAL TEST SUITE ---
@app.local_entrypoint()
def main():
    print("🚀 Starting Pipeline Test...")

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

    # Send to cloud
    print("📡 Invoking run_pose_pipeline.remote()...")

    # Since run_pose_pipeline is now a CPU function, this spins up a cheap CPU worker
    # which then dispatches to your GPU workers.
    ret = run_pose_pipeline.remote({"image": dummy_img})

    if ret["success"]:
        print(f"✅ Success! Embedding Size: {len(ret['embedding'])}")
        print(f"   Joints detected: {len(ret.get('pose', {}))}")
    else:
        print(f"❌ Error: {ret['error']}")
