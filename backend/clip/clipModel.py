import torch
from transformers import CLIPProcessor, CLIPModel
# from transformers.image_utils import load_image
from backend.modal_app import image, app
import modal


# Notes
# Take embeded from text
# Take embdeded from image


@app.cls(gpu="A10G", image=image)
class CLIPModel():
    @modal.enter()
    def setup(self, device : str):
        self.device = device or ("cuda" if torch.cuda_is_available() else "cpu")
        self.model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        self.model.to(self.device)
        self.model.eval()
    
    def encode_text(self, texts, requires_grad = True, normalize = False):
        inputs = self.processor(text=texts, return_tensors="pt", padding=True, truncation=True).to(self.device)

        if requires_grad:
            outputs = self.model.get_text_features(**inputs)
        else:
            with torch.no_grad():
                outputs = self.model.get_text_features(**inputs)

        if normalize:
            outputs = torch.nn.functional.normalize(outputs, dim=-1)

        return outputs
        
    def encode_image(self, image, requires_grad = True, normalize = False):
        inputs = self.processor(images=image, return_tensors="pt").to(self.device)

        if requires_grad:
            outputs = self.model.get_image_features(**inputs)
        else:
            with torch.no_grad():
                outputs = self.model.get_image_features(**inputs)

        if normalize:
            outputs = torch.nn.functional.normalize(outputs, dim=-1)

        return outputs
    

