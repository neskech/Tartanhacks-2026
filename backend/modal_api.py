from modal_app import app, image
from pose.inference import SAM3DBodyInference
from pose_embed.inference import PoseEmbedding
import modal
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from typing import Dict, Any, Tuple, Optional


def parse_image(image_data: str | bytes) -> Tuple[np.ndarray, Tuple[int, int]]:
    """
    Parse image data (base64 string or bytes) into a numpy array.

    Args:
        image_data: Base64 encoded image string OR image bytes

    Returns:
        Tuple of (image_array, img_shape) where:
            - image_array: numpy array in RGB format (H, W, 3)
            - img_shape: tuple (height, width)

    Raises:
        ValueError: If image cannot be decoded
    """
    if isinstance(image_data, str):
        # Base64 encoded string
        image_bytes = base64.b64decode(image_data)
    else:
        # Assume it's already bytes
        image_bytes = image_data

    # Convert to PIL Image then numpy array
    pil_image = Image.open(BytesIO(image_bytes))
    # Convert to RGB if needed
    if pil_image.mode != "RGB":
        pil_image = pil_image.convert("RGB")

    # Convert to numpy array (H, W, 3) in RGB format
    img_array = np.array(pil_image)
    img_shape = img_array.shape[:2]  # (height, width)

    return img_array, img_shape


def extract_pose_embedding_from_image(
    img_array: np.ndarray,
    pose_inference: SAM3DBodyInference,
    pose_embedding: PoseEmbedding,
    use_bbox_detector: bool = True,
    img_shape: Optional[Tuple[int, int]] = None,
) -> Dict[str, Any]:
    """
    Extract pose and embedding from an image.

    Args:
        img_array: Image as numpy array in RGB format (H, W, 3)
        pose_inference: Initialized SAM3DBodyInference instance
        pose_embedding: Initialized PoseEmbedding instance
        use_bbox_detector: Whether to use bounding box detector for pose prediction
        img_shape: Optional image shape (height, width) for embedding extraction.
                  If None, uses img_array.shape[:2]

    Returns:
        Dictionary with:
            - "embedding": numpy array (the pose embedding vector) or None
            - "pose": Dictionary mapping joint names to (x, y) coordinates
            - "success": Boolean indicating if pose was detected and embedding extracted
            - "error": Optional error message if something failed
    """
    # Predict 2D pose
    try:
        pose_dict = pose_inference.predict_2d_pose(
            image=img_array,
            use_bbox_detector=use_bbox_detector,
        )
    except Exception as e:
        return {
            "embedding": None,
            "pose": {},
            "success": False,
            "error": f"Pose prediction failed: {str(e)}",
        }

    # Check if pose was detected
    if not pose_dict:
        return {
            "embedding": None,
            "pose": {},
            "success": False,
            "error": "No person detected in image",
        }

    # Extract embedding from pose
    embedding_img_shape = img_shape if img_shape is not None else img_array.shape[:2]
    try:
        embedding = pose_embedding.extract_embedding(
            pose_dict=pose_dict,
            img_shape=embedding_img_shape,
        )
    except Exception as e:
        return {
            "embedding": None,
            "pose": pose_dict,
            "success": False,
            "error": f"Embedding extraction failed: {str(e)}",
        }

    return {
        "embedding": embedding,
        "pose": pose_dict,
        "success": True,
        "error": None,
    }


# 2. Optimized Web Endpoint
@app.function(image=image)
@modal.fastapi_endpoint(method="POST")  # Replaces web_endpoint
def test_endpoint(data: dict):
    return {"response": f"mock response for: {data.get('message', '')}"}


@app.function(image=image)
@modal.fastapi_endpoint(method="POST")
def image_to_pose_embedding(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Endpoint that takes an image, predicts 2D pose, and extracts pose embedding.

    Args:
        data: Dictionary containing:
            - "image": Base64 encoded image string OR image bytes
            - "use_bbox_detector": Optional bool (default True)
            - "img_shape": Optional tuple (height, width) for embedding extraction

    Returns:
        Dictionary with:
            - "embedding": List of floats (the pose embedding vector) or None
            - "pose": Dictionary mapping joint names to (x, y) coordinates
            - "success": Boolean indicating if pose was detected
            - "error": Optional error message
    """
    # Parse image
    image_data = data.get("image")
    if image_data is None:
        return {"error": "No image provided", "success": False, "embedding": None, "pose": {}}

    try:
        img_array, img_shape = parse_image(image_data)
    except Exception as e:
        return {
            "error": f"Failed to decode image: {str(e)}",
            "success": False,
            "embedding": None,
            "pose": {},
        }

    # Initialize pose inference and embedding extraction
    pose_inference = SAM3DBodyInference()
    pose_embedding = PoseEmbedding()

    # Extract pose and embedding
    use_bbox_detector = data.get("use_bbox_detector", True)
    embedding_img_shape = data.get("img_shape")
    result = extract_pose_embedding_from_image(
        img_array=img_array,
        pose_inference=pose_inference,
        pose_embedding=pose_embedding,
        use_bbox_detector=use_bbox_detector,
        img_shape=embedding_img_shape,
    )

    # Convert embedding to list for JSON serialization
    if result["embedding"] is not None:
        result["embedding"] = result["embedding"].tolist()

    # Add image shape to response
    result["img_shape"] = img_shape

    return result
