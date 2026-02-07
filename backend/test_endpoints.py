"""
Test file for Modal endpoints.
Run with: modal run backend/test_endpoints.py

Note: Make sure the endpoints are running first:
  modal serve backend/modal_api.py
"""
from pathlib import Path

import modal
from PIL import Image
import numpy as np

from modal_app import app


def create_test_image() -> np.ndarray:
    """Create a simple test image (RGB, 480x640) as numpy array."""
    # Create a simple test image
    img_array = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    return img_array


def load_test_image(image_path: Path) -> np.ndarray:
    """Load an image file from disk and convert to numpy array."""
    pil_image = Image.open(image_path)
    # Convert to RGB if needed
    if pil_image.mode != "RGB":
        pil_image = pil_image.convert("RGB")
    return np.array(pil_image)


@app.local_entrypoint()
def main():
    """Test the pose pipeline logic directly using .remote()."""
    print("🚀 Starting Posematic Internal Test Suite...")
    print("=" * 60)

    # Look up the live function by name from the running app
    try:
        run_pose_pipeline = modal.Function.from_name("backend", "run_pose_pipeline")
        print("✓ Connected to run_pose_pipeline from 'backend' app\n")
    except Exception as e:
        print(f"✗ Error connecting to function: {e}")
        print("\nMake sure the app is running first:")
        print("  modal serve backend/modal_api.py")
        print("Or deploy it:")
        print("  modal deploy backend/modal_api.py")
        return

    # Test 1: Generated test image
    print("-" * 60)
    print("[Test 1] Testing run_pose_pipeline with generated test image")
    print("-" * 60)

    dummy_img = create_test_image()
    print(f"Created test image with shape: {dummy_img.shape}")

    payload = {
        "image": dummy_img,  # Pass numpy array directly - no base64 overhead!
        "use_bbox_detector": True,
    }

    try:
        print("Calling function (this may take a while for model loading)...")
        final_result = run_pose_pipeline.remote(payload)

        if final_result.get("success"):
            print("✅ Success!")
            print(f"   - Joints: {len(final_result.get('pose', {}))}")
            embedding = final_result.get("embedding")
            if embedding is not None:
                print(f"   - Embedding dimension: {len(embedding)}")
            else:
                print("   - Embedding: None")
            print(f"   - Image shape: {final_result.get('img_shape')}")
        else:
            print(f"❌ Error: {final_result.get('error')}")
            if final_result.get("pose"):
                print("   - Pose was detected but embedding extraction failed")
    except Exception as e:
        print(f"💥 Failed: {e}")
        import traceback
        traceback.print_exc()

    # Test 2: Real image if available
    print("\n" + "-" * 60)
    print("[Test 2] Testing run_pose_pipeline with real image (if available)")
    print("-" * 60)

    backend_dir = Path(__file__).parent
    data_dir = backend_dir / "data" / "downloaded_pins"

    if data_dir.exists():
        image_files = list(data_dir.rglob("*.jpg")) + list(data_dir.rglob("*.png"))
        if image_files:
            test_image_path = image_files[0]
            print(f"Using test image: {test_image_path.relative_to(backend_dir)}")
            try:
                test_image = load_test_image(test_image_path)
                print(f"Loaded image with shape: {test_image.shape}")

                payload = {
                    "image": test_image,
                    "use_bbox_detector": True,
                }

                print("Calling function (this may take a while for model loading)...")
                final_result = run_pose_pipeline.remote(payload)

                if final_result.get("success"):
                    print("✅ Success!")
                    print(f"   - Joints: {len(final_result.get('pose', {}))}")
                    embedding = final_result.get("embedding")
                    if embedding is not None:
                        print(f"   - Embedding dimension: {len(embedding)}")
                    else:
                        print("   - Embedding: None")
                    print(f"   - Image shape: {final_result.get('img_shape')}")
                    pose = final_result.get("pose", {})
                    if pose:
                        # Show first few keypoints
                        pose_items = list(pose.items())[:5]
                        print(f"   - Sample keypoints: {dict(pose_items)}")
                else:
                    print(f"❌ Error: {final_result.get('error')}")
                    if final_result.get("pose"):
                        print("   - Pose was detected but embedding extraction failed")
            except Exception as e:
                print(f"💥 Failed: {e}")
                import traceback
                traceback.print_exc()
        else:
            print("No image files found in data/downloaded_pins/")
    else:
        print("Data directory not found, skipping real image test")

    print("\n" + "=" * 60)
    print("Testing complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
