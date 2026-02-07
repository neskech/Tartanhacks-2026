# Mosaic: Competitive Art Search Platform

**Tartanhacks 2026 - Team BlueTrees**

A competitive art platform that brings together **competitive gaming**, **digital art**, and **AI** - three seemingly disparate worlds united in one system. Artists compete by creating art from prompts, and our AI-powered search engine helps find similar artwork for voting and inspiration.

## The Mosaic

Like a mosaic, this project combines unrelated pieces into something beautiful:
- 🎮 **Competitive Gaming**: Art battles where creators compete
- 🎨 **Digital Art**: Pinterest-style image database
- 🤖 **AI**: Hybrid pose + semantic search powered by Modal.com

## Overview

This system enables competitive art by allowing artists to:
- **Search by pose**: Find images with similar body poses using SAM 3D Body + PoseC3D
- **Search by description**: Find images matching text prompts using CLIP embeddings
- **Hybrid search**: Combine pose and semantic similarity for the best matches
- **Filter portraits**: Automatically exclude portrait images to focus on full-body poses

Perfect for art battle competitions where artists need to find similar work, get inspired, or verify originality!

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

- **Pose-based search**: Find images with similar body poses - perfect for art battles where pose matters
- **CLIP semantic search**: Find images matching text descriptions - "a person doing yoga", "warrior pose", etc.
- **Hybrid search**: Combine pose and CLIP with configurable weights for the best matches
- **Portrait filtering**: Automatically filter out portrait images to focus on full-body poses
- **Serverless GPU inference**: Powered by Modal.com - scales automatically
- **Fast pre-computed embeddings**: Uses cached embeddings for instant search results
- **Competitive art ready**: Search similar artwork for voting, inspiration, or originality checks

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
- `sketch`: Base64-encoded query image
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
closeness_score = lambda * pose_similarity + (1 - lambda) * clip_similarity
```

## Usage Examples

### Python Client

```python
import modal
import requests
import base64

# Get endpoint URL
search_function = modal.Function.from_name("backend", "search_similar_images")
endpoint_url = search_function.get_web_url()

# Load your art piece
with open("my_art.png", "rb") as f:
    image_bytes = f.read()
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

# Search for similar artwork
payload = {
    "sketch": image_base64,
    "text": "a warrior in battle pose",  # The prompt from the art battle
    "k": 6,  # Top 6 similar pieces
    "lambda": 0.7,  # 70% pose similarity, 30% semantic similarity
    "filter_portraits": True  # Only full-body poses
}

response = requests.post(endpoint_url, json=payload, timeout=300)
results = response.json()

print("Similar artwork found:")
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

### The Competitive Art Flow

1. **Artist creates art** from a prompt (e.g., "warrior pose")
2. **Upload to system** - image gets processed for embeddings
3. **Search for similar work** - find other artists' interpretations
4. **Vote and compete** - see how your art compares!

### Technical Pipeline

#### 1. Pose Embedding Pipeline
- **Pose Detection**: SAM 3D Body detects 2D pose keypoints (70 joints)
- **Pose Embedding**: PoseC3D extracts a 512-dimensional embedding
- **Similarity**: Cosine similarity between pose embeddings

#### 2. CLIP Embedding Pipeline
- **Text/Image Encoding**: CLIP model encodes text or images into 512-dim vectors
- **Similarity**: Cosine similarity between CLIP embeddings

#### 3. Hybrid Search
1. **Query Processing**:
   - Extract pose embedding from sketch/image
   - Extract CLIP embedding from text query
2. **Database Search**:
   - Load pre-computed embeddings from `embeddings.json`
   - Compute hybrid similarity scores: `score = λ × pose_sim + (1-λ) × clip_sim`
   - Filter portraits if requested (using pre-computed CLIP embeddings)
3. **Ranking**: Sort by closeness score and return top-k results

#### 4. Portrait Filtering
- Uses pre-computed CLIP text embeddings for portrait-related keywords
- Compares image CLIP embeddings (from JSON) to portrait vs full-body text embeddings
- Filters during scoring loop (no additional CLIP inference needed - super fast!)

## Configuration

### Modal Image Setup

The Modal image is configured in `backend/modal_app.py`:
- Python 3.11
- CUDA dependencies for GPU inference
- Local code mounted at runtime
- Persistent volume for embeddings and images

### Model Checkpoints

Required checkpoints (should be in `backend/checkpoints/`):
- SAM 3D Body model
- PoseC3D model weights
- CLIP model (auto-downloaded from HuggingFace)

## Performance

- **Pose embedding**: ~1-2 seconds per image (GPU inference)
- **CLIP embedding**: ~0.5 seconds per image (GPU inference)
- **Search**: ~0.7 seconds to load 103MB embeddings.json, then instant results
- **Portrait filtering**: Negligible overhead (uses pre-computed embeddings - no extra inference!)
- **Database**: Currently ~3,500 images indexed

## Quick Start

1. **Deploy to Modal**:
   ```bash
   modal deploy backend/modal_api.py
   ```

2. **Generate embeddings** (if you have new images):
   ```bash
   python backend/pinterest/generate_embeddings.py
   ```

3. **Test the search**:
   ```bash
   python backend/test_search_images.py
   ```

## Troubleshooting

### "ModuleNotFoundError: No module named 'backend'"
- Ensure Modal image includes all necessary directories
- Check `PYTHONPATH` in `modal_app.py`

### "Embeddings file not found"
- Run `python pinterest/generate_embeddings.py` first
- Ensure `data/embeddings.json` exists

### "No person detected"
- Image may not contain a visible person
- Try adjusting `use_bbox_detector` parameter

### Slow search performance
- Ensure `embeddings.json` is in the Modal volume
- Check that portrait filtering is using pre-computed embeddings (not re-encoding images)

## Team

**Team BlueTrees** - Tartanhacks 2026

Built for the "Mosaic" theme - bringing together competitive gaming, digital art, and AI into one cohesive platform.

## Tech Stack

- **Backend**: Python 3.11, Modal.com (serverless GPU)
- **Models**: SAM 3D Body, PoseC3D, OpenAI CLIP
- **Frontend**: Next.js (see `frontend/` directory)
- **Storage**: Modal Volumes for embeddings and images

