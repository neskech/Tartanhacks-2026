"""
Modal client script to generate pose embeddings for all images in data/downloaded_pins/.
This script runs locally and calls the Modal API endpoint to process images.
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


def process_image(
    image_path: Path,
    endpoint_url: str,
    use_bbox_detector: bool = True,
) -> Optional[Dict]:
    """
    Process a single image through the Modal API endpoint.

    Args:
        image_path: Path to the image file
        endpoint_url: URL of the Modal web endpoint
        use_bbox_detector: Whether to use bounding box detector

    Returns:
        Dictionary with embedding and metadata, or None if failed
    """
    try:
        # Read image file as bytes
        image_bytes = image_path.read_bytes()

        # Encode as base64 string
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

        # Prepare request payload
        payload = {
            "image": image_base64,
            "use_bbox_detector": use_bbox_detector,
        }

        # Call Modal API endpoint via HTTP
        response = requests.post(endpoint_url, json=payload, timeout=300)
        response.raise_for_status()

        result = response.json()
        return result
    except requests.exceptions.RequestException as e:
        print(f"  HTTP error processing {image_path.name}: {str(e)}")
        return None
    except Exception as e:
        print(f"  Error processing {image_path.name}: {str(e)}")
        return None


def main():
    """Main function to process all images and generate embeddings."""
    # Get paths
    backend_dir = Path(__file__).parent.parent
    data_dir = backend_dir / "data" / "downloaded_pins"
    output_file = backend_dir / "data" / "pose_embeddings.json"

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

    # Get Modal function reference and endpoint URL
    print("Connecting to Modal function...")
    try:
        modal_function = modal.Function.from_name(
            "backend", "image_to_pose_embedding"
        )
        # Get the web endpoint URL using Modal's API (as per Modal docs)
        endpoint_url = modal_function.get_web_url()
        print(f"Using endpoint: {endpoint_url}")
    except Exception as e:
        print(f"Error connecting to Modal function: {str(e)}")
        print("Make sure the Modal app is deployed: modal deploy backend/modal_api.py")
        return

    # Process images and build mapping
    embeddings_map: Dict[str, List[float]] = {}
    successful = 0
    failed = 0
    no_person = 0

    print(f"\nProcessing {len(image_files)} images...")
    for i, image_path in enumerate(image_files, 1):
        relative_path = get_relative_path(image_path, data_dir)
        print(f"[{i}/{len(image_files)}] Processing: {relative_path}")

        result = process_image(image_path, endpoint_url)

        if result is None:
            failed += 1
            continue

        if not result.get("success", False):
            error = result.get("error", "Unknown error")
            if "No person detected" in error:
                no_person += 1
            else:
                failed += 1
            print(f"  Failed: {error}")
            continue

        embedding = result.get("embedding")
        if embedding is None:
            failed += 1
            print("  Failed: No embedding in response")
            continue

        # Store embedding with relative path as key
        embeddings_map[relative_path] = embedding
        successful += 1
        print(f"  Success! Embedding dimension: {len(embedding)}")

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
