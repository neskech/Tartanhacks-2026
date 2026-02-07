from huggingface_hub import snapshot_download
import os

def _hf_download(repo_id):
    """Downloads model checkpoints from hugging face into the checkpoints directory"""
    download_path = os.path.join(os.getcwd(), "checkpoints", repo_id.split("/")[-1])

    local_dir = snapshot_download(
        repo_id=repo_id,
        local_dir=download_path,
        local_dir_use_symlinks=False 
    )

    return os.path.join(local_dir, "model.ckpt"), os.path.join(local_dir, "assets", "mhr_model.pt")

_hf_download('facebook/sam-3d-body-dinov3')
_hf_download('facebook/sam-3d-body-vith') 