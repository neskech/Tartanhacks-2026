"""
Modal wrapper for SAM 3D Body 2D pose inference.
"""
from pathlib import Path
from typing import Dict, Tuple

from modal_app import image, app
import modal
import numpy as np

# Container-only imports - use Image.imports() context manager
with image.imports():
    from sam_3d_body import SAM3DBodyEstimator, load_sam_3d_body
    from sam_3d_body.metadata.mhr70 import mhr_names
    from tools.build_detector import HumanDetector


def _load():
    # Should be backend/ locally and /root on modal
    parent = Path(__file__).resolve().parent.parent
    CHECKPOINT_PATH = str(parent / 'checkpoints' / 'sam-3d-body-vith' /
                          'model.ckpt')
    MHR_PATH = str(parent / 'checkpoints' / 'sam-3d-body-vith' / 'assets' /
                   'mhr_model.pt')
    return load_sam_3d_body(checkpoint_path=CHECKPOINT_PATH, mhr_path=MHR_PATH)


@app.cls(gpu="T4", image=image)
class SAM3DBodyInference:
    """Modal model class for SAM 3D Body 2D pose inference."""

    @modal.enter()
    def setup(self):
        """Initialize the SAM 3D Body model."""

        print("Loading SAM 3D Body model...")
        # Load model from HuggingFace
        # Default to dinov3 model, can be made configurable
        self.model, self.model_cfg = _load()

        # Store joint names for keypoint mapping
        self.joint_names = mhr_names

        # Initialize bounding box detector
        print("Loading bounding box detector...")
        self.human_detector = HumanDetector(name="vitdet", device="cuda")
        print("Bounding box detector loaded!")

        print("SAM 3D Body model loaded successfully!")

    @modal.method()
    def predict_2d_pose(
        self,
        image: np.ndarray,
        use_bbox_detector: bool = True,
    ) -> Dict[str, Tuple[float, float]]:
        """
        Predict 2D pose keypoints for a single person from an image.

        Args:
            image: Input image as numpy array in RGB format (H, W, 3)
            use_bbox_detector: If True, use bounding box detector to find person.
                             If False, use full image as bounding box.

        Returns:
            Dictionary mapping joint names to (x, y) coordinates.
            Returns empty dict if no person is detected.
        """

        # Validate and convert image to numpy array
        img = np.asarray(image).copy()
        # Validate image shape
        if len(img.shape) != 3 or img.shape[2] != 3:
            raise ValueError(
                f"Expected RGB image with shape (H, W, 3), got {img.shape}"
            )

        # Create estimator
        estimator = SAM3DBodyEstimator(
            sam_3d_body_model=self.model,
            model_cfg=self.model_cfg,
            human_detector=self.human_detector if use_bbox_detector else None,
            human_segmentor=None,
            fov_estimator=None,
        )

        # Process image
        outputs = estimator.process_one_image(img)

        # Handle no person detected
        if not outputs or len(outputs) == 0:
            return {}

        # Get first person's output
        person_output = outputs[0]

        # Extract 2D keypoints
        keypoints_2d = person_output["pred_keypoints_2d"]  # Shape: [70, 2]

        # Map keypoints to joint names
        pose_dict = {}
        for idx, joint_name in enumerate(self.joint_names):
            if idx < len(keypoints_2d):
                x, y = float(keypoints_2d[idx][0]), float(keypoints_2d[idx][1])
                pose_dict[joint_name] = (x, y)

        return pose_dict
