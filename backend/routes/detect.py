"""
API Routes – /detect, /logs, /logs/{id}, /logs/export
"""
import os
import csv
import io
import shutil
from datetime import datetime

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse

from services.detection import detect_from_image, detect_from_video
from services.log_service import delete_log, get_all_logs, save_log

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed file extensions
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
VIDEO_EXTS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}


# POST /detect
@router.post("/detect")
async def detect_plate(file: UploadFile = File(...)):
    """
    Upload an image or video file.
    Returns detected plate(s) with timestamp and annotated image (base64).
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in IMAGE_EXTS | VIDEO_EXTS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Upload an image or video.",
        )

    # ── Save uploaded file temporarily
    safe_name = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    # ── Run detection pipeline 
    try:
        if ext in IMAGE_EXTS:
            detections = detect_from_image(file_path)
        else:
            detections = detect_from_video(file_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(exc)}")

    if not detections:
        return JSONResponse(
            content={
                "success": False,
                "message": "No license plate detected in the uploaded file.",
                "detections": [],
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }
        )

    # ── Persist each detection as a log entry ──────────────────────
    saved = []
    for d in detections:
        log_entry = save_log(
            plate=d["plate"],
            image_b64=d["image_b64"],
            confidence=d["confidence"],
        )
        saved.append(
            {
                "id": log_entry["id"],
                "plate": log_entry["plate"],
                "timestamp": log_entry["timestamp"],
                "confidence": log_entry["confidence"],
                "image_b64": log_entry["image_b64"],
                "bbox": d.get("bbox"),
            }
        )

    return JSONResponse(
        content={
            "success": True,
            "message": f"{len(saved)} plate(s) detected.",
            "detections": saved,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
    )


# GET /logs
@router.get("/logs")
def list_logs():
    """Return all detection logs (newest first)."""
    logs = get_all_logs()
    return JSONResponse(
        content={
            "success": True,
            "count": len(logs),
            "logs": logs,
        }
    )


# DELETE /logs/{id}
@router.delete("/logs/{log_id}")
def remove_log(log_id: str):
    """Delete a specific log entry by its UUID."""
    deleted = delete_log(log_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Log entry not found.")
    return JSONResponse(content={"success": True, "message": "Log deleted successfully."})


# GET /logs/export   – CSV download
@router.get("/logs/export")
def export_logs_csv():
    """Download all logs as a CSV file (without image data)."""
    logs = get_all_logs()

    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["id", "plate", "timestamp", "confidence"],
        extrasaction="ignore",
    )
    writer.writeheader()
    for log in logs:
        writer.writerow(
            {
                "id": log.get("id", ""),
                "plate": log.get("plate", ""),
                "timestamp": log.get("timestamp", ""),
                "confidence": log.get("confidence", ""),
            }
        )

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.read().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=anpr_logs.csv"},
    )
