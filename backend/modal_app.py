import modal
from pathlib import Path

volume = modal.Volume.from_name("posematic-assets", create_if_missing=True)
backend_dir = Path(__file__).parent
app = modal.App("backend")

# 1. Improved Image Definition
image = (
    modal.Image.debian_slim(python_version="3.11").apt_install(
        "git", "libgl1", "libglib2.0-0", "libsm6", "libxext6", "ffmpeg",
        "libgomp1", "gcc", "g++", "build-essential")
    # 1. Build Engine & Base Deps
    .pip_install(
        # "numpy==1.26.4",
        # "matplotlib>=3.8.0",
        "opencv-python>=4.8.0",
        "setuptools", "wheel", "cython"
    )

    # 2. Problematic builds (Isolated layers)
    .pip_install("xtcocotools", extra_options="--no-build-isolation").
    pip_install_from_pyproject("pyproject.toml").pip_install(
        "detectron2 @ git+https://github.com/facebookresearch/detectron2.git@a1ce2f9"
    )
    .pip_install('fastapi')
    # 3. Environment Config (Still a Build Step)
    .env({
        "PYTHONPATH": "/root/pose:/root/clip:/root/pinterest:/root/pose_embed",
        "HF_HOME": "/root/.cache/huggingface",
    })

    # 5. Local Mounts (LAST)
    # These are "Local Steps" - changing these files won't trigger an image rebuild
    .add_local_file(backend_dir / "modal_app.py", remote_path="/root/modal_app.py")
    .add_local_file(backend_dir / "clip_text_embeddings.json", remote_path="/root/clip_text_embeddings.json")
    .add_local_dir(backend_dir / "pose",
                   remote_path="/root/pose").add_local_dir(
                       backend_dir / "clip",
                       remote_path="/root/clip").add_local_dir(
                           backend_dir / "pinterest",
                           remote_path="/root/pinterest").add_local_dir(
                               backend_dir / "pose_embed",
                               remote_path="/root/pose_embed"))
