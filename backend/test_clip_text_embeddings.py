"""
Test file for getting CLIP text embeddings and saving to JSON.
"""
from pathlib import Path
import modal
import requests
import json

# Words/phrases to get embeddings for
TEST_WORDS = [
    "a portrait",
    "headshot",
    "face only",
    "close-up portrait",
    "full body",
    "full body pose",
    "person standing",
    "full figure",
    "a person",
]


def main():
    """Get CLIP embeddings for words and save to JSON."""
    print("Connecting to Modal API...")
    try:
        clip_function = modal.Function.from_name("backend", "text_to_clip_embedding")
        clip_endpoint_url = clip_function.get_web_url()

        if clip_endpoint_url is None:
            print("Error: Could not get endpoint URL.")
            return

        print(f"Connected to: {clip_endpoint_url}")
    except Exception as e:
        print(f"Error: {e}")
        return

    print(f"\nGetting embeddings for {len(TEST_WORDS)} words...")
    embeddings_dict = {}

    for word in TEST_WORDS:
        try:
            payload = {"text": word, "normalize": False}
            response = requests.post(clip_endpoint_url, json=payload, timeout=60)
            response.raise_for_status()
            result = response.json()

            if result.get("success") and result.get("embedding"):
                embeddings_dict[word] = result["embedding"]
                print(f"  ✓ {word}")
            else:
                print(f"  ✗ {word}: {result.get('error', 'Unknown error')}")
        except Exception as e:
            print(f"  ✗ {word}: {e}")

    # Save to JSON
    output_path = Path(__file__).parent / "data" / "test" / "clip_text_embeddings.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(embeddings_dict, f, indent=2)

    print(f"\nSaved {len(embeddings_dict)} embeddings to: {output_path}")


if __name__ == "__main__":
    main()
