import modal
from pathlib import Path

backend_dir = Path(__file__).parent
app = modal.App("backend")

# 1. Improved Image Definition
image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install(
        "git", "libgl1", "libglib2.0-0", "libsm6", "libxext6", "ffmpeg", "libgomp1"
    )
    # Install dependencies from pyproject.toml
    .pip_install_from_pyproject(
        str(backend_dir / "pyproject.toml"),
    )
    .pip_install(
        "detectron2 @ git+https://github.com/facebookresearch/detectron2.git@a1ce2f9",
        # Note: If detectron2 fails, you may need to install 'ninja' and 'torch' first
    )
    # BAKE the code into the image for faster starts
    .add_local_dir(backend_dir / "pose", remote_path="/root/pose")
    .add_local_dir(backend_dir / "clip", remote_path="/root/clip")
    .add_local_dir(backend_dir / "pinterest", remote_path="/root/pinterest")
    # Bake checkpoints into the image
    .add_local_dir(backend_dir / "checkpoints", remote_path="/root/checkpoints", copy=True)
    .add_local_dir(backend_dir / "data" / "downloaded_pins", remote_path="/root/data/downloaded_pins", copy=True)
    .env({
        "PYTHONPATH": "/root/pose:/root/clip:/root/pinterest",
        "HF_HOME": "/root/.cache/huggingface",
    })
)
