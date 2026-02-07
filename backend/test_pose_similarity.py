"""
Test file to compute pose embedding similarities between three images.
"""
from pathlib import Path
import base64
import numpy as np
import modal
import requests
from PIL import Image, ImageDraw
import matplotlib.pyplot as plt

# Image paths - update these to point to your test images
IMAGE_A_PATH = Path(__file__).parent / "data" / "test" / "off.png"
IMAGE_B_PATH = Path(__file__).parent / "data" / "test" / "draw.png"
IMAGE_C_PATH = Path(__file__).parent / "data" / "test" / "real.png"


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """
    Compute cosine similarity between two vectors.

    Args:
        a: First vector as numpy array
        b: Second vector as numpy array

    Returns:
        Cosine similarity score between -1 and 1
    """
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return float(np.dot(a, b) / (norm_a * norm_b))


def load_image_base64(image_path: Path) -> str:
    """Load an image file and convert to base64 string."""
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    image_bytes = image_path.read_bytes()
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    return image_base64


def load_image_array(image_path: Path) -> np.ndarray:
    """Load an image file and convert to numpy array."""
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    pil_image = Image.open(image_path)
    if pil_image.mode != "RGB":
        pil_image = pil_image.convert("RGB")

    return np.array(pil_image)


def draw_pose_on_image(
    image: np.ndarray,
    pose_dict: dict,
    joint_radius: int = 5,
    line_width: int = 3,
) -> np.ndarray:
    """
    Draw 2D pose skeleton on an image using PIL for better drawing quality.

    Args:
        image: Image as numpy array (H, W, 3) in RGB format
        pose_dict: Dictionary mapping joint names to (x, y) coordinates
        joint_radius: Radius of joint circles
        line_width: Width of skeleton lines

    Returns:
        Image with pose drawn on it
    """
    # Convert to PIL Image for drawing
    pil_img = Image.fromarray(image)
    draw = ImageDraw.Draw(pil_img)

    # Define main body skeleton connections (simplified, focusing on main body parts)
    # Format: (joint1_name, joint2_name)
    skeleton_connections = [
        # Head
        ("nose", "left-eye"),
        ("nose", "right-eye"),
        ("left-eye", "left-ear"),
        ("right-eye", "right-ear"),
        # Torso
        ("left-shoulder", "right-shoulder"),
        ("left-shoulder", "left-hip"),
        ("right-shoulder", "right-hip"),
        ("left-hip", "right-hip"),
        # Left arm
        ("left-shoulder", "left-elbow"),
        ("left-elbow", "left-wrist"),
        # Right arm
        ("right-shoulder", "right-elbow"),
        ("right-elbow", "right-wrist"),
        # Left leg
        ("left-hip", "left-knee"),
        ("left-knee", "left-ankle"),
        # Right leg
        ("right-hip", "right-knee"),
        ("right-knee", "right-ankle"),
    ]

    # Draw skeleton connections (green lines)
    for joint1_name, joint2_name in skeleton_connections:
        if joint1_name in pose_dict and joint2_name in pose_dict:
            x1, y1 = pose_dict[joint1_name]
            x2, y2 = pose_dict[joint2_name]

            # Skip if coordinates are invalid (0, 0 or negative)
            if x1 > 0 and y1 > 0 and x2 > 0 and y2 > 0:
                x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                # Draw line in green
                draw.line([(x1, y1), (x2, y2)], fill=(0, 255, 0), width=line_width)

    # Draw joints (red circles)
    for joint_name, (x, y) in pose_dict.items():
        x, y = int(x), int(y)
        if x > 0 and y > 0:
            # Draw circle for joint
            bbox = [x - joint_radius, y - joint_radius,
                    x + joint_radius, y + joint_radius]
            draw.ellipse(bbox, fill=(255, 0, 0), outline=(255, 0, 0))

    # Convert back to numpy array
    return np.array(pil_img)


def main():
    """Test pose embedding similarities between three images."""
    print("=" * 60)
    print("Pose Embedding Similarity Test")
    print("=" * 60)

    # Load images
    print("\n[Step 1] Loading images...")
    images_base64 = {}
    image_names = {"A": IMAGE_A_PATH, "B": IMAGE_B_PATH, "C": IMAGE_C_PATH}

    for name, path in image_names.items():
        try:
            images_base64[name] = load_image_base64(path)
            print(f"  ✓ Loaded image {name}: {path.name}")
        except FileNotFoundError as e:
            print(f"  ✗ Failed to load image {name}: {e}")
            return

    # Get Modal function references and endpoint URLs
    print("\n[Step 2] Connecting to Modal API...")
    try:
        pose_function = modal.Function.from_name("backend", "image_to_pose_embedding")
        pose_endpoint_url = pose_function.get_web_url()

        if pose_endpoint_url is None:
            print("Error: Could not get endpoint URL from Modal function.")
            print("Make sure the Modal app is deployed: modal deploy backend/modal_api.py")
            return

        print(f"  ✓ Connected to pose endpoint: {pose_endpoint_url}")
    except Exception as e:
        print(f"✗ Error connecting to Modal functions: {str(e)}")
        print("Make sure the Modal app is deployed: modal deploy backend/modal_api.py")
        return

    # Load original images for visualization
    print("\n[Step 3] Loading original images for visualization...")
    images_array = {}
    for name, path in image_names.items():
        try:
            images_array[name] = load_image_array(path)
            print(f"  ✓ Loaded image array for {name}")
        except FileNotFoundError as e:
            print(f"  ✗ Failed to load image array for {name}: {e}")
            return

    # Get pose embeddings
    print("\n[Step 4] Getting pose embeddings...")
    embeddings = {}
    poses = {}  # Store pose dictionaries for visualization

    for name, image_base64 in images_base64.items():
        print(f"  Processing image {name}...")
        try:
            # Make HTTP request to pose embedding endpoint
            payload = {
                "image": image_base64,
                "use_bbox_detector": True,
            }
            response = requests.post(pose_endpoint_url, json=payload, timeout=300)
            response.raise_for_status()
            result = response.json()

            if not result.get("success", False) or result.get("embedding") is None:
                error_msg = result.get("error", "Unknown error")
                print(f"    ✗ Failed to get embedding for {name}: {error_msg}")
                embeddings[name] = None
                poses[name] = None
                continue

            embedding = result["embedding"]
            pose_dict = result.get("pose", {})
            embeddings[name] = np.array(embedding, dtype=np.float32)
            poses[name] = pose_dict
            print(
                f"    ✓ Got embedding for {name} (dim: {len(embedding)}, joints: {len(pose_dict)})")
        except requests.exceptions.RequestException as e:
            print(f"    ✗ HTTP error processing {name}: {str(e)}")
            embeddings[name] = None
            poses[name] = None
        except Exception as e:
            print(f"    ✗ Failed to get embedding for {name}: {e}")
            embeddings[name] = None
            poses[name] = None

    # Check if we have all embeddings
    if any(emb is None for emb in embeddings.values()):
        print("\n✗ Failed: Not all images have valid pose embeddings")
        return

    # Compute pairwise similarities
    print("\n[Step 5] Computing pairwise cosine similarities...")
    print("-" * 60)

    pairs = [("A", "B"), ("A", "C"), ("B", "C")]

    for name1, name2 in pairs:
        emb1 = embeddings[name1]
        emb2 = embeddings[name2]

        similarity = cosine_similarity(emb1, emb2)

        print(f"  {name1} ↔ {name2}: {similarity:.4f}")

    # Visualize poses
    print("\n[Step 6] Creating visualizations...")
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))

    for idx, name in enumerate(["A", "B", "C"]):
        ax = axes[idx]
        img = images_array[name]
        pose_dict = poses[name]

        # Draw pose on image
        if pose_dict:
            img_with_pose = draw_pose_on_image(img, pose_dict)
        else:
            img_with_pose = img

        ax.imshow(img_with_pose)
        ax.set_title(f"Image {name}\nJoints: {len(pose_dict) if pose_dict else 0}")
        ax.axis("off")

    plt.tight_layout()

    # Save visualization
    output_path = Path(__file__).parent / "data" / "test" / "pose_visualization.png"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    print(f"  ✓ Saved visualization to: {output_path}")

    # Show plot
    plt.show()

    print("\n" + "=" * 60)
    print("Test Complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
