"""
Image utility helpers – bounding box drawing, base64 encoding, preprocessing.
"""
import cv2
import base64
import numpy as np


def draw_bounding_box(frame: np.ndarray, x1: int, y1: int, x2: int, y2: int, label: str) -> np.ndarray:
    """Draw a green bounding box + label on the frame."""
    annotated = frame.copy()
    cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 3)
    font = cv2.FONT_HERSHEY_SIMPLEX
    (tw, th), _ = cv2.getTextSize(label, font, 0.9, 2)
    # Background rectangle for text
    cv2.rectangle(annotated, (x1, y1 - th - 14), (x1 + tw + 8, y1), (0, 255, 0), -1)
    cv2.putText(annotated, label, (x1 + 4, y1 - 8), font, 0.9, (0, 0, 0), 2)
    return annotated


def frame_to_base64(frame: np.ndarray) -> str:
    """Encode a BGR frame (NumPy array) as a base64 JPEG string."""
    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
    return base64.b64encode(buffer).decode("utf-8")


def preprocess_plate(plate_img: np.ndarray) -> np.ndarray:
    """
    Prepare a cropped plate image for OCR:
    - Convert to grayscale
    - Scale up 2x for better OCR accuracy
    """
    gray = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    return gray
