from clip.clipModel import Clip
from PIL import Image
import torch

image = Image.open("clip/dog.jpg")
image2 = Image.open("clip/cat.jpg")
queries = ["dog", "cat", "fish", "human", "field", "flowers"]

CLIP = Clip()
# CLIP.setup()
image_enc = CLIP.encode_image([image, image2])
query_enc = CLIP.encode_text(queries)

similarity_score = CLIP.get_similarity_score(query_enc, image_enc)
print(similarity_score)





