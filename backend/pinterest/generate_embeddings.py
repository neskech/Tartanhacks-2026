"""
Modal client script to generate pose and CLIP embeddings for all images in data/downloaded_pins/.
This script runs locally and calls the Modal API endpoints to process images.
"""
import base64
import json
from pathlib import Path
from typing import Dict, List, Optional

import modal
import requests


def find_image_files(data_dir: Path) -> List[Path]:
    """
    Recursively find all image files in the data directory.

    Args:
        data_dir: Path to the data/downloaded_pins directory

    Returns:
        List of Path objects for all image files (relative to data_dir)
    """
    image_extensions = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}
    image_files = []

    for ext in image_extensions:
        image_files.extend(data_dir.rglob(f"*{ext}"))
        image_files.extend(data_dir.rglob(f"*{ext.upper()}"))

    # Sort for consistent processing
    image_files.sort()
    return image_files


def get_relative_path(file_path: Path, base_dir: Path) -> str:
    """
    Get relative path from base directory.

    Args:
        file_path: Full path to the file
        base_dir: Base directory to get relative path from

    Returns:
        Relative path as string
    """
    return str(file_path.relative_to(base_dir))


def process_image_embeddings(
    image_path: Path,
    pose_endpoint_url: str,
    clip_endpoint_url: str,
    use_bbox_detector: bool = True,
) -> Optional[Dict[str, List[float]]]:
    """
    Process a single image through both pose and CLIP Modal API endpoints.

    Args:
        image_path: Path to the image file
        pose_endpoint_url: URL of the pose embedding endpoint
        clip_endpoint_url: URL of the CLIP image embedding endpoint
        use_bbox_detector: Whether to use bounding box detector for pose

    Returns:
        Dictionary with 'pose_embedding' and 'clip_embedding' keys, or None if failed
    """
    try:
        # Read image file as bytes
        image_bytes = image_path.read_bytes()

        # Encode as base64 string
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

        results = {}

        # Get pose embedding
        pose_payload = {
            "image": image_base64,
            "use_bbox_detector": use_bbox_detector,
        }
        try:
            pose_response = requests.post(
                pose_endpoint_url, json=pose_payload, timeout=300)
            pose_response.raise_for_status()
            pose_result = pose_response.json()

            if pose_result.get("success") and pose_result.get("embedding"):
                results["pose_embedding"] = pose_result["embedding"]
            else:
                print(
                    f"  Pose embedding failed: {pose_result.get('error', 'Unknown error')}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"  HTTP error getting pose embedding: {str(e)}")
            return None

        # Get CLIP embedding
        clip_payload = {
            "image": image_base64,
            "normalize": False,
        }
        try:
            clip_response = requests.post(
                clip_endpoint_url, json=clip_payload, timeout=300)
            clip_response.raise_for_status()
            clip_result = clip_response.json()

            if clip_result.get("success") and clip_result.get("embedding"):
                results["clip_embedding"] = clip_result["embedding"]
            else:
                print(
                    f"  CLIP embedding failed: {clip_result.get('error', 'Unknown error')}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"  HTTP error getting CLIP embedding: {str(e)}")
            return None

        return results
    except Exception as e:
        print(f"  Error processing {image_path.name}: {str(e)}")
        return None


def main():
    """Main function to process all images and generate pose and CLIP embeddings."""
    # Get paths
    backend_dir = Path(__file__).parent.parent
    data_dir = backend_dir / "data" / "downloaded_pins"
    output_file = backend_dir / "data" / "embeddings.json"

    if not data_dir.exists():
        print(f"Error: Data directory not found: {data_dir}")
        return

    # Find all image files
    print(f"Scanning for images in {data_dir}...")
    image_files = find_image_files(data_dir)
    print(f"Found {len(image_files)} image files")

    if len(image_files) == 0:
        print("No image files found. Exiting.")
        return

    # Get Modal function references and endpoint URLs
    print("Connecting to Modal functions...")
    try:
        pose_function = modal.Function.from_name("backend", "image_to_pose_embedding")
        clip_function = modal.Function.from_name("backend", "image_to_clip_embedding")

        pose_endpoint_url = pose_function.get_web_url()
        clip_endpoint_url = clip_function.get_web_url()

        if pose_endpoint_url is None or clip_endpoint_url is None:
            print("Error: Could not get endpoint URLs from Modal functions.")
            print("Make sure the Modal app is deployed: modal deploy backend/modal_api.py")
            return

        print(f"Pose endpoint: {pose_endpoint_url}")
        print(f"CLIP endpoint: {clip_endpoint_url}")
    except Exception as e:
        print(f"Error connecting to Modal functions: {str(e)}")
        print("Make sure the Modal app is deployed: modal deploy backend/modal_api.py")
        return

    # Process images and build mapping
    # Structure: {relative_path: {"pose_embedding": [...], "clip_embedding": [...]}}
    embeddings_map: Dict[str, Dict[str, List[float]]] = {}
    successful = 0
    failed = 0
    no_person = 0

    print(f"\nProcessing {len(image_files)} images...")
    for i, image_path in enumerate(image_files, 1):
        # Get relative path from downloaded_pins directory (includes board subdirectory)
        relative_path = get_relative_path(image_path, data_dir)
        print(f"[{i}/{len(image_files)}] Processing: {relative_path}")

        result = process_image_embeddings(
            image_path, pose_endpoint_url, clip_endpoint_url
        )

        if result is None:
            failed += 1
            continue

        # Check if we got both embeddings
        if "pose_embedding" not in result or "clip_embedding" not in result:
            failed += 1
            print("  Failed: Missing one or both embeddings")
            continue

        # Store both embeddings with relative path as key
        embeddings_map[relative_path] = {
            "pose_embedding": result["pose_embedding"],
            "clip_embedding": result["clip_embedding"],
        }
        successful += 1
        print(
            f"  Success! Pose: {len(result['pose_embedding'])} dims, "
            f"CLIP: {len(result['clip_embedding'])} dims"
        )

    # Save results to JSON
    print(f"\nSaving results to {output_file}...")
    output_data = {
        "embeddings": embeddings_map,
        "metadata": {
            "total_images": len(image_files),
            "successful": successful,
            "failed": failed,
            "no_person_detected": no_person,
        },
    }

    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, "w") as f:
        json.dump(output_data, f, indent=2)

    print("\nDone!")
    print(f"  Total images: {len(image_files)}")
    print(f"  Successful: {successful}")
    print(f"  Failed: {failed}")
    print(f"  No person detected: {no_person}")
    print(f"  Results saved to: {output_file}")


if __name__ == "__main__":
    main()
