#!/usr/bin/env python3
"""Benchmark script to measure how long it takes to load embeddings.json"""

import json
import time
from pathlib import Path


def main():
    # Path to embeddings.json
    embeddings_path = Path(__file__).parent / "data" / "embeddings.json"

    print(f"Loading embeddings from: {embeddings_path}")
    print(f"File size: {embeddings_path.stat().st_size / (1024 * 1024):.2f} MB")
    print()

    # Measure loading time
    start_time = time.time()

    with open(embeddings_path, "r") as f:
        embeddings_data = json.load(f)

    end_time = time.time()
    load_time = end_time - start_time

    # Print results
    print(f"✓ Loaded successfully!")
    print(f"  Time taken: {load_time:.3f} seconds ({load_time * 1000:.1f} ms)")
    print()

    # Print some stats about the loaded data
    if "embeddings" in embeddings_data:
        num_images = len(embeddings_data["embeddings"])
        print(f"  Number of images: {num_images}")

        # Check first entry structure
        if num_images > 0:
            first_key = list(embeddings_data["embeddings"].keys())[0]
            first_entry = embeddings_data["embeddings"][first_key]
            print(f"  Sample entry key: {first_key}")
            if "pose_embedding" in first_entry:
                print(f"  Pose embedding dimension: {len(first_entry['pose_embedding'])}")
            if "clip_embedding" in first_entry:
                print(f"  CLIP embedding dimension: {len(first_entry['clip_embedding'])}")


if __name__ == "__main__":
    main()
