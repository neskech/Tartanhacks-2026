import torch
from transformers import CLIPProcessor, CLIPModel
from modal_app import image, app
import modal


# Notes
# Take embeded from text
# Take embdeded from image


@app.cls(gpu="A10G", image=image)
class Clip():
    # @modal.enter()
    def __init__(self, device = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
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

    def get_similarity_score(text_enc, image_enc):
        return torch.matmul(text_enc.pooler_output, image_enc.pooler_output.T)
    

