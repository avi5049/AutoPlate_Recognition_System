import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Camera, CameraOff, Loader2, ZapIcon } from "lucide-react";
import { detectPlate } from "../api/axios";
import toast from "react-hot-toast";
import ResultCard from "./ResultCard";

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: "environment",
};

export default function WebcamPanel() {
  const webcamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    // Convert base64 dataURL to a File blob
    const res = await fetch(imageSrc);
    const blob = await res.blob();
    const file = new File([blob], "webcam_capture.jpg", { type: "image/jpeg" });

    setLoading(true);
    try {
      const response = await detectPlate(file);
      const data = response.data;
      if (!data.success || data.detections.length === 0) {
        toast.error("No plate detected in captured frame.");
        setResult(null);
      } else {
        toast.success(`Plate detected: ${data.detections[0].plate}`);
        setResult(data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Detection failed.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Camera size={18} className="text-primary-400" />
            Live Camera Capture
          </h2>
          <button
            onClick={() => { setActive((v) => !v); setResult(null); }}
            className={active ? "btn-danger" : "btn-primary text-sm px-4 py-2"}
          >
            {active ? <><CameraOff size={14} className="inline mr-1.5" />Stop Camera</> : <><Camera size={14} className="inline mr-1.5" />Start Camera</>}
          </button>
        </div>

        {active ? (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-dark-900">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full"
              />
            </div>
            <button
              onClick={capture}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" />Detecting…</>
              ) : (
                <><ZapIcon size={18} />Capture & Detect</>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <CameraOff size={40} strokeWidth={1} className="mb-3 text-gray-700" />
            <p className="text-sm">Camera is off. Click "Start Camera" to begin.</p>
          </div>
        )}
      </div>

      {result && <ResultCard result={result} />}
    </div>
  );
}
