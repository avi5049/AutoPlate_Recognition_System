
import os
import re
import cv2
import numpy as np
import easyocr
import torch
from ultralytics import YOLO
from dotenv import load_dotenv

from utils.image_utils import draw_bounding_box, frame_to_base64, preprocess_plate

load_dotenv()

_original_load = torch.load
def _patched_load(*args, **kwargs):
    kwargs.setdefault("weights_only", False)
    return _original_load(*args, **kwargs)
torch.load = _patched_load


_MODEL_PATH = os.getenv(
    "MODEL_PATH",
    "../runs/detect/plate_detector7/weights/license_plate_best.pt",
)

print("[ANPR] Loading YOLOv8 model …")
yolo_model = YOLO(_MODEL_PATH)

# Restore original torch.load after YOLO initialization
torch.load = _original_load

print("[ANPR] Loading EasyOCR reader …")
ocr_reader = easyocr.Reader(["en"], gpu=False)

print("[ANPR] Models ready ✓")


# ── Text cleaning and Indian Plate Pattern Enforcement ───────────────
def format_indian_plate(text: str) -> str:
    """Strip noise and enforce Indian plate patterns (e.g. GJ03BZ0425).
       Fixes common OCR confusions like 8<->B, 2<->Z, 6<->G based on position.
    """
    cleaned = re.sub(r"[^A-Z0-9]", "", text.upper())
    if not cleaned:
        return ""

    num_to_let = {
        '0': 'O', '1': 'I', '2': 'Z', '3': 'J', '4': 'A', '5': 'S', '6': 'G', '8': 'B'
    }
    let_to_num = {
        'O': '0', 'I': '1', 'L': '4', 'J': '3', 'A': '4', 'G': '6', 'S': '5', 'B': '8', 
        'Z': '2', 'Q': '0', 'C': '0', 'D': '0', 'T': '1'
    }

    chars = list(cleaned)
    n = len(chars)

    # Standard Indian civilian plates are strictly 9 or 10 characters: LL NN LL NNNN or LL NN L NNNN
    # If the plate length is out of these bounds (e.g. Military plates or oddly spaced ones), 
    if n in (9, 10):
        # First 2 must be LETTERS (State Code)
        for i in range(2):
            if chars[i] in num_to_let: chars[i] = num_to_let[chars[i]]
            
        # Next 2 must be NUMBERS (RTO Code)
        for i in range(2, 4):
            if chars[i] in let_to_num: chars[i] = let_to_num[chars[i]]
            
        # Last 4 must be NUMBERS (Unique Serial)
        for i in range(n-4, n):
            if chars[i] in let_to_num: chars[i] = let_to_num[chars[i]]
            
        # Middle section (Series) must be LETTERS
        for i in range(4, n-4):
            if chars[i] in num_to_let: chars[i] = num_to_let[chars[i]]

    return "".join(chars).strip()


# ── OCR on a cropped plate image ───────────────────────────────────
def run_ocr(plate_img: np.ndarray) -> tuple[str, float]:
    """
    Run EasyOCR on a pre-processed (grayscale) plate crop.
    Returns (cleaned_text, best_confidence).
    """

    results = ocr_reader.readtext(
        plate_img,
        allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        paragraph=False
    )
    if not results:
        return "", 0.0

    # Group bounding boxes by chunks of 15 vertical pixels to account for slight camera tilt.
    # r[0][0][1] is top-left Y, r[0][0][0] is top-left X.
    results.sort(key=lambda r: (int(r[0][0][1]) // 15, int(r[0][0][0])))
    
    # Pick the average confidence
    avg_conf = sum(r[2] for r in results) / len(results)
    raw_text = "".join(r[1] for r in results)
    

    cleaned = format_indian_plate(raw_text)
    
    return cleaned, float(avg_conf)


def is_valid_plate(text: str) -> bool:
    """Filter out random text (like logos or fleet numbers) caught by low YOLO config."""
    if len(text) < 7 or len(text) > 11:
        return False

    nums = sum(c.isdigit() for c in text)
    letters = sum(c.isalpha() for c in text)
    return nums >= 2 and letters >= 2



def process_frame(frame: np.ndarray) -> list[dict]:
    """
    Run the full ANPR pipeline on one BGR frame.

    Returns a list of detections, each dict containing:
        plate, confidence, bbox (x1,y1,x2,y2), annotated_b64
    """
    detections: list[dict] = []
    
    # Dropped confidence aggressively to 0.05 to catch flat, painted-on plates 
    results = yolo_model(frame, conf=0.05, verbose=False)

    for r in results:
        if r.boxes is None:
            continue

        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            det_conf = float(box.conf[0])

            plate_crop = frame[y1:y2, x1:x2]
            if plate_crop.size == 0:
                continue

            processed = preprocess_plate(plate_crop)
            plate_text, ocr_conf = run_ocr(processed)

            if not plate_text:
                continue

            # Strict validation to block logos/text ONLY IF YOLO was unconfident (det_conf < 0.6)
            # If YOLO is > 0.6 confident, it is almost certainly a real license plate!
            if det_conf < 0.6 and not is_valid_plate(plate_text):
                continue

            annotated = draw_bounding_box(frame, x1, y1, x2, y2, plate_text)
            image_b64 = frame_to_base64(annotated)


            final_conf = max(det_conf, ocr_conf)

            detections.append(
                {
                    "plate": plate_text,
                    "confidence": round(final_conf, 4),
                    "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                    "image_b64": image_b64,
                }
            )

    return detections


# ── Image file 
def detect_from_image(image_path: str) -> list[dict]:
    """Load an image file and run the ANPR pipeline."""
    frame = cv2.imread(image_path)
    if frame is None:
        raise ValueError(f"Cannot read image: {image_path}")
    return process_frame(frame)


# ── Video file 
def detect_from_video(video_path: str, sample_every: int = 15) -> list[dict]:
    """
    Process a video file, sampling every `sample_every` frames to keep
    response times reasonable.  Returns the unique plates found.
    """
    cap = cv2.VideoCapture(video_path)
    all_detections: list[dict] = []
    seen_plates: set[str] = set()
    frame_idx = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % sample_every == 0:
            detections = process_frame(frame)
            for d in detections:
                if d["plate"] not in seen_plates:
                    seen_plates.add(d["plate"])
                    all_detections.append(d)

        frame_idx += 1

    cap.release()
    return all_detections
