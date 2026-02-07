from backend.modal_app import app, image
import modal

# 2. Optimized Web Endpoint
@app.function(image=image)
@modal.fastapi_endpoint(method="POST") # Replaces web_endpoint
def test_endpoint(data: dict):
    return {"response": f"mock response for: {data.get('message', '')}"}

