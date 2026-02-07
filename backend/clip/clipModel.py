"""
Modal wrapper for CLIP model for text and image embeddings.
"""
from typing import Union, List
import numpy as np

from modal_app import image, app
import modal

# Container-only imports
with image.imports():
    import torch
    from transformers import CLIPProcessor, CLIPModel
    from PIL import Image


@app.cls(gpu="T4", image=image)
class Clip:
    """Modal model class for CLIP text and image embeddings."""

    @modal.enter()
    def setup(self):
        """Initialize the CLIP model."""
        print("Loading CLIP model...")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        self.model.to(self.device)
        self.model.eval()
        print("CLIP model loaded successfully!")

    @modal.method()
    def encode_text(
        self,
        texts: Union[str, List[str]],
        normalize: bool = False,
    ) -> np.ndarray:
        """
        Encode text(s) into CLIP embeddings.

        Args:
            texts: Single text string or list of text strings
            normalize: If True, normalize the embeddings to unit vectors

        Returns:
            Numpy array of embeddings. Shape: (num_texts, embedding_dim)
        """
        # Ensure texts is a list
        if isinstance(texts, str):
            texts = [texts]

        inputs = self.processor(
            text=texts, return_tensors="pt", padding=True, truncation=True
        ).to(self.device)

        with torch.no_grad():
            outputs = self.model.get_text_features(**inputs)

            # get_text_features returns BaseModelOutputWithPooling
            # Use pooler_output (pooled features) or fallback to last_hidden_state[:, 0]
            if outputs.pooler_output is not None:
                features = outputs.pooler_output
            else:
                # Fallback to last_hidden_state - take the [CLS] token (first token)
                features = outputs.last_hidden_state[:, 0]

        if normalize:
            features = torch.nn.functional.normalize(features, dim=-1)

        # Convert to numpy and return
        return features.cpu().numpy().astype(np.float32)

    @modal.method()
    def encode_image(
        self,
        image: Union[np.ndarray, Image.Image],
        normalize: bool = False,
    ) -> np.ndarray:
        """
        Encode image(s) into CLIP embeddings.

        Args:
            image: PIL Image or numpy array (H, W, 3) in RGB format
            normalize: If True, normalize the embeddings to unit vectors

        Returns:
            Numpy array of embeddings. Shape: (num_images, embedding_dim)
        """
        # Convert numpy array to PIL Image if needed
        if isinstance(image, np.ndarray):
            if len(image.shape) != 3 or image.shape[2] != 3:
                raise ValueError(
                    f"Expected RGB image array with shape (H, W, 3), got {image.shape}"
                )
            # Convert to PIL Image
            image = Image.fromarray(image.astype(np.uint8))

        # Ensure image is RGB
        if image.mode != "RGB":
            image = image.convert("RGB")

        inputs = self.processor(images=image, return_tensors="pt").to(self.device)

        with torch.no_grad():
            outputs = self.model.get_image_features(**inputs)

            # get_image_features returns BaseModelOutputWithPooling
            # Use pooler_output (pooled features) or fallback to last_hidden_state[:, 0]
            if outputs.pooler_output is not None:
                features = outputs.pooler_output
            else:
                # Fallback to last_hidden_state - take the [CLS] token (first token)
                features = outputs.last_hidden_state[:, 0]

        if normalize:
            features = torch.nn.functional.normalize(features, dim=-1)

        # Convert to numpy and return
        return features.cpu().numpy().astype(np.float32)
