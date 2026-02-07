from clip.clipModel import Clip
from PIL import Image
import torch

image = Image.open("clip/dog.jpg")
queries = ["dog", "cat"]

CLIP = Clip()
# CLIP.setup()
image_enc = CLIP.encode_image(image)
query_enc = CLIP.encode_text(queries)

similarity_score = torch.matmul(query_enc.pooler_output , image_enc.pooler_output.T)
print(similarity_score)





