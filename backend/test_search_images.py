"""
Test file for the search_similar_images API function.
"""
from pathlib import Path
import base64
import numpy as np
import modal
import requests
from PIL import Image
import matplotlib.pyplot as plt
from io import BytesIO

# Test image path
TEST_IMAGE_PATH = Path(__file__).parent / "data" / "test" / "draw.png"
# Text description for the search
TEST_TEXT = "a person standing with arms raised"


def load_image_base64(image_path: Path) -> str:
    """Load an image file and convert to base64 string."""
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    image_bytes = image_path.read_bytes()
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    return image_base64


def decode_base64_image(image_base64: str) -> np.ndarray:
    """Decode a base64 image string to numpy array."""
    image_bytes = base64.b64decode(image_base64)
    pil_image = Image.open(BytesIO(image_bytes))
    if pil_image.mode != "RGB":
        pil_image = pil_image.convert("RGB")
    return np.array(pil_image)


def main():
    """Test the search_similar_images API function."""
    print("=" * 60)
    print("Search Similar Images API Test")
    print("=" * 60)

    # Load test image
    print(f"\n[Step 1] Loading test image: {TEST_IMAGE_PATH.name}")
    try:
        sketch_base64 = load_image_base64(TEST_IMAGE_PATH)
        print(f"  ✓ Loaded image: {TEST_IMAGE_PATH.name}")
    except FileNotFoundError as e:
        print(f"  ✗ Failed to load image: {e}")
        return

    # Get Modal function reference and endpoint URL
    print("\n[Step 2] Connecting to Modal API...")
    try:
        search_function = modal.Function.from_name("backend", "search_similar_images")
        search_endpoint_url = search_function.get_web_url()

        if search_endpoint_url is None:
            print("Error: Could not get endpoint URL from Modal function.")
            print("Make sure the Modal app is deployed: modal deploy backend/modal_api.py")
            return

        print(f"  ✓ Connected to search endpoint: {search_endpoint_url}")
    except Exception as e:
        print(f"✗ Error connecting to Modal functions: {str(e)}")
        print("Make sure the Modal app is deployed: modal deploy backend/modal_api.py")
        return

    # Call the search API
    print(f"\n[Step 3] Searching for similar images...")
    print(f"  Text query: '{TEST_TEXT}'")
    print(f"  Requesting top 6 results...")

    try:
        payload = {
            "sketch": sketch_base64,
            "text": TEST_TEXT,
            "k": 6,
            "lambda": 0.5,  # Equal weight for pose and CLIP
        }

        response = requests.post(search_endpoint_url, json=payload, timeout=300)
        response.raise_for_status()
        result = response.json()

        if not result.get("success", False):
            error_msg = result.get("error", "Unknown error")
            print(f"  ✗ Search failed: {error_msg}")
            return

        results = result.get("results", [])
        print(f"  ✓ Found {len(results)} results")

        if len(results) == 0:
            print("  ✗ No results returned")
            return

    except requests.exceptions.RequestException as e:
        print(f"  ✗ HTTP error: {str(e)}")
        return
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return

    # Display results
    print(f"\n[Step 4] Displaying top {len(results)} results...")

    # Create matplotlib figure with grid
    num_results = len(results)
    cols = 3
    rows = (num_results + cols - 1) // cols  # Ceiling division

    fig, axes = plt.subplots(rows, cols, figsize=(15, 5 * rows))
    if num_results == 1:
        axes = [axes]
    else:
        axes = axes.flatten() if rows > 1 else axes

    # Display original query image in first position
    print("  Loading query image...")
    query_img = Image.open(TEST_IMAGE_PATH)
    if query_img.mode != "RGB":
        query_img = query_img.convert("RGB")

    axes[0].imshow(query_img)
    axes[0].set_title(f"Query Image\nText: '{TEST_TEXT}'", fontsize=10, fontweight='bold')
    axes[0].axis("off")

    # Display search results
    for idx, result in enumerate(results):
        ax_idx = idx + 1  # +1 because first position is query image
        if ax_idx >= len(axes):
            break

        try:
            # Decode base64 image
            result_image_base64 = result.get("image", "")
            if not result_image_base64:
                continue

            result_img = decode_base64_image(result_image_base64)
            score = result.get("score", 0.0)
            path = result.get("path", "unknown")

            axes[ax_idx].imshow(result_img)
            axes[ax_idx].set_title(
                f"Result {idx + 1}\nScore: {score:.4f}\n{Path(path).name}",
                fontsize=9
            )
            axes[ax_idx].axis("off")

            print(f"  ✓ Result {idx + 1}: {Path(path).name} (score: {score:.4f})")
        except Exception as e:
            print(f"  ✗ Failed to display result {idx + 1}: {e}")
            axes[ax_idx].axis("off")
            axes[ax_idx].text(0.5, 0.5, f"Error loading\nresult {idx + 1}",
                              ha='center', va='center', transform=axes[ax_idx].transAxes)

    # Hide unused subplots
    for idx in range(len(results) + 1, len(axes)):
        axes[idx].axis("off")

    plt.tight_layout()

    # Save visualization
    output_path = Path(__file__).parent / "data" / "test" / "search_results.png"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    print(f"\n  ✓ Saved visualization to: {output_path}")

    # Show plot
    plt.show()

    print("\n" + "=" * 60)
    print("Test Complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
