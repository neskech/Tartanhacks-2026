# PoseFramer: The Next Iteration Of Art Reference

**Tartanhacks 2026 - Team BlueTrees**

A hybrid image search system that helps artists find the perfect reference images by combining pose estimation and semantic search. Built with Modal.com for serverless GPU inference.

## The Problem

Finding reference material is a pain for artists:
- **Endless searching** for the perfect pose
- **Compromising** with reference that's not close to the initial ideation
- **Anatomical errors** caused by poor reference material

Existing technology falls short:
- **Text search** doesn't understand pose structure
- **Reverse image search** requires exact visual matches

## Our Solution

PoseFramer allows artists to search for reference images using:
- **Pose similarity**: Find images with similar body poses using SAM 3D Body + PoseC3D
- **Semantic search**: Find images matching text descriptions using CLIP embeddings
- **Hybrid search**: Combine both for the best matches

**Goal**: Allow artists to create perfect mosaics without compromising on their creative vision.

## Architecture

```
┌─────────────────┐
│  Client Script  │
│  (Local Python) │
└────────┬────────┘
         │ HTTP/API Calls
         ▼
┌─────────────────────────────────────┐
│         Modal.com Platform           │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  modal_api.py                │  │
│  │  - Web Endpoints             │  │
│  │  - Search Pipeline           │  │
│  └───────────┬──────────────────┘  │
│              │                       │
│  ┌───────────▼──────────┐           │
│  │  SAM 3D Body        │           │
│  │  (GPU: A10G)        │           │
│  │  - 2D Pose Detection│           │
│  └───────────┬──────────┘           │
│              │                       │
│  ┌───────────▼──────────┐           │
│  │  PoseC3D            │           │
│  │  (GPU: A10G)        │           │
│  │  - Pose Embeddings  │           │
│  └───────────┬──────────┘           │
│              │                       │
│  ┌───────────▼──────────┐           │
│  │  CLIP Model         │           │
│  │  (GPU: A10G)        │           │
│  │  - Text/Image Embed │           │
│  └─────────────────────┘           │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Embeddings DB  │
│  (JSON + Images)│
└─────────────────┘
```

## Features

- **Pose-based search**: Find images with similar body poses - perfect for reference matching
- **CLIP semantic search**: Find images matching text descriptions - "a person doing yoga", "warrior pose", etc.
- **Hybrid search**: Combine pose and CLIP with configurable weights for the best matches
- **Portrait filtering**: Automatically filter out portrait images to focus on full-body poses
- **Serverless GPU inference**: Powered by Modal.com - scales automatically
- **Fast pre-computed embeddings**: Uses cached embeddings for instant search results

## Project Structure

```
backend/
├── modal_app.py              # Modal app and image configuration
├── modal_api.py              # Main API endpoints and search logic
├── clip_text_embeddings.json # Pre-computed CLIP text embeddings
├── data/
│   ├── embeddings.json       # Pre-computed pose + CLIP embeddings for all images
│   ├── downloaded_pins/      # Pinterest image database
│   └── test/                 # Test images
├── pose/                     # SAM 3D Body pose estimation
│   └── inference.py          # Modal class for pose detection
├── pose_embed/               # PoseC3D embedding extraction
│   └── inference.py          # Modal class for pose embeddings
├── clip/                     # CLIP model
│   └── clipModel.py          # Modal class for CLIP embeddings
├── pinterest/
│   ├── generate_embeddings.py # Script to generate embeddings.json
│   └── scrape.py             # Pinterest scraping utilities
└── test_*.py                 # Test scripts for various endpoints
```

## Setup

### Prerequisites

- Python 3.11+
- Modal.com account and API token
- `uv` package manager (or pip)

### Installation

1. **Install dependencies**:
   ```bash
   cd backend
   uv sync  # or: pip install -r requirements.txt
   ```

2. **Set up Modal**:
   ```bash
   modal token new
   ```

3. **Deploy the Modal app**:
   ```bash
   modal deploy backend/modal_api.py
   ```

### Generate Embeddings Database

Before searching, you need to generate embeddings for your image database:

```bash
cd backend
python pinterest/generate_embeddings.py
```

This will:
- Recursively find all images in `data/downloaded_pins/`
- Call the Modal API to generate pose and CLIP embeddings
- Save results to `data/embeddings.json`

## API Endpoints

All endpoints are deployed on Modal.com and accessible via HTTP POST requests.

### 1. Pose Embedding

**Endpoint**: `image_to_pose_embedding`

Extract pose embedding from an image.

**Request**:
```json
{
  "image": "<base64_encoded_image>",
  "use_bbox_detector": true
}
```

**Response**:
```json
{
  "success": true,
  "embedding": [0.123, 0.456, ...],  // 512-dim pose embedding
  "pose": {
    "nose": [x, y],
    "left-shoulder": [x, y],
    ...
  },
  "img_shape": [height, width]
}
```

### 2. CLIP Text Embedding

**Endpoint**: `text_to_clip_embedding`

Get CLIP embedding for text.

**Request**:
```json
{
  "text": "a person doing yoga",
  "normalize": false
}
```

**Response**:
```json
{
  "success": true,
  "embedding": [0.123, 0.456, ...]  // 512-dim CLIP embedding
}
```

### 3. CLIP Image Embedding

**Endpoint**: `image_to_clip_embedding`

Get CLIP embedding for an image.

**Request**:
```json
{
  "image": "<base64_encoded_image>",
  "normalize": false
}
```

**Response**:
```json
{
  "success": true,
  "embedding": [0.123, 0.456, ...]  // 512-dim CLIP embedding
}
```

### 4. Hybrid Image Search

**Endpoint**: `search_similar_images`

Search for similar images using pose + CLIP hybrid search.

**Request**:
```json
{
  "sketch": "<base64_encoded_image>",
  "text": "a person",
  "k": 10,
  "lambda": 0.5,
  "filter_portraits": false
}
```

**Parameters**:
- `sketch`: Base64-encoded query image (your sketch or reference)
- `text`: Text description for CLIP search
- `k`: Number of results to return (default: 10)
- `lambda`: Weight for pose similarity (0-1, default: 0.5)
  - `lambda=1.0`: Only pose similarity
  - `lambda=0.0`: Only CLIP similarity
  - `lambda=0.5`: Equal weight
- `filter_portraits`: Filter out portrait images (default: false)

**Response**:
```json
{
  "success": true,
  "results": [
    {
      "path": "pose-reference/image1.jpg",
      "image": "<base64_encoded_image>",
      "score": 0.8234
    },
    ...
  ]
}
```

**Search Formula**:
```
Sim = λ × Pose_Sim + (1 - λ) × Clip_Sim
```

Where:
- `Pose_Sim = f(ImageA, ImageB)` - Cosine similarity between pose embeddings
- `Clip_Sim = f(Description, ImageB)` - Cosine similarity between CLIP embeddings

## Usage Examples

### Python Client

```python
import modal
import requests
import base64

# Get endpoint URL
search_function = modal.Function.from_name("backend", "search_similar_images")
endpoint_url = search_function.get_web_url()

# Load your sketch or reference image
with open("my_sketch.png", "rb") as f:
    image_bytes = f.read()
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

# Search for similar reference images
payload = {
    "sketch": image_base64,
    "text": "a warrior in battle pose",  # Describe what you're looking for
    "k": 6,  # Top 6 results
    "lambda": 0.7,  # 70% pose similarity, 30% semantic similarity
    "filter_portraits": True  # Only full-body poses
}

response = requests.post(endpoint_url, json=payload, timeout=300)
results = response.json()

print("Similar reference images found:")
for i, result in enumerate(results["results"], 1):
    print(f"{i}. {result['path']} (similarity: {result['score']:.4f})")
```

### Test Scripts

**Test pose similarity**:
```bash
python backend/test_pose_similarity.py
```

**Test image search**:
```bash
python backend/test_search_images.py
```

**Generate CLIP text embeddings**:
```bash
python backend/test_clip_text_embeddings.py
```

## How It Works

### The Pose Embedding Pipeline

1. **Pose Detection**: SAM 3D Body detects 2D pose keypoints (70 joints)
2. **Pose Embedding**: PoseC3D extracts a 512-dimensional embedding from the pose
3. **Similarity**: Cosine similarity between pose embeddings

### The CLIP Embedding Pipeline

1. **Text/Image Encoding**: CLIP model encodes text or images into 512-dim vectors
2. **Similarity**: Cosine similarity between CLIP embeddings
   - If image and text represent the same concept, their embeddings are similar

### Hybrid Search

1. **Query Processing**:
   - Extract pose embedding from sketch/image
   - Extract CLIP embedding from text query
2. **Database Search**:
   - Load pre-computed embeddings from `embeddings.json`
   - Compute hybrid similarity scores: `Sim = λ × Pose_Sim + (1-λ) × Clip_Sim`
   - Filter portraits if requested (using pre-computed CLIP embeddings)
3. **Ranking**: Sort by similarity score and return top-k results

### Portrait Filtering

- Uses pre-computed CLIP text embeddings for portrait-related keywords ("a portrait", "headshot", etc.)
- Compares image CLIP embeddings (from JSON) to portrait vs full-body text embeddings
- Filters during scoring loop (no additional CLIP inference needed - super fast!)




## Tech Stack

- **Backend**: Python 3.11, Modal.com (serverless GPU)
- **Models**: SAM 3D Body, PoseC3D, OpenAI CLIP
- **Frontend**: Next.js (see `frontend/` directory)
- **Storage**: Modal Volumes for embeddings and images
