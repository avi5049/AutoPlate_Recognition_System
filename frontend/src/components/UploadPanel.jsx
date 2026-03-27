import { useCallback, useRef, useState } from "react";
import { Upload, ImageIcon, Film, X, Loader2 } from "lucide-react";
import { detectPlate } from "../api/axios";
import toast from "react-hot-toast";

export default function UploadPanel({ onResult }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const isVideo = file?.type?.startsWith("video");

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ["image/jpeg","image/png","image/bmp","image/webp","video/mp4","video/avi","video/quicktime","video/x-matroska","video/webm"];
    if (!allowed.some((t) => f.type === t || f.name.match(/\.(jpg|jpeg|png|bmp|webp|mp4|avi|mov|mkv|webm)$/i))) {
      toast.error("Unsupported file type. Use image or video files.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleDetect = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    try {
      const res = await detectPlate(file, (e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
      });
      const data = res.data;
      if (!data.success || data.detections.length === 0) {
        toast.error(data.message || "No plate detected.");
        onResult(null);
      } else {
        toast.success(`${data.detections.length} plate(s) detected!`);
        onResult(data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Detection failed. Is the backend running?");
      onResult(null);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    onResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="glass-card p-6 space-y-4 animate-fade-in">
      <h2 className="font-semibold text-white flex items-center gap-2">
        <Upload size={18} className="text-primary-400" />
        Upload File
      </h2>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !file && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl min-h-[180px] flex flex-col items-center justify-center cursor-pointer transition-all duration-200
          ${dragOver ? "border-primary-500 bg-primary-500/10" : "border-white/15 hover:border-primary-500/50 hover:bg-white/[0.02]"}
          ${file ? "cursor-default" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {preview ? (
          <div className="w-full p-3">
            {isVideo ? (
              <video src={preview} controls className="w-full max-h-64 rounded-lg object-contain" />
            ) : (
              <img src={preview} alt="preview" className="w-full max-h-64 rounded-lg object-contain" />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); clear(); }}
              className="absolute top-3 right-3 w-7 h-7 bg-dark-600/80 hover:bg-red-500/80 border border-white/10 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="text-center p-8">
            <div className="flex justify-center gap-3 mb-3">
              <ImageIcon className="text-primary-400/60" size={28} />
              <Film className="text-purple-400/60" size={28} />
            </div>
            <p className="text-sm text-gray-400 font-medium">Drop image or video here</p>
            <p className="text-xs text-gray-600 mt-1">JPG, PNG, MP4, AVI, MOV supported</p>
            <button className="mt-4 btn-secondary text-sm px-4 py-2" onClick={() => inputRef.current?.click()}>
              Browse Files
            </button>
          </div>
        )}
      </div>

      {/* File info */}
      {file && (
        <div className="flex items-center gap-3 text-xs text-gray-400 bg-dark-600/50 rounded-lg px-3 py-2">
          {isVideo ? <Film size={14} className="text-purple-400" /> : <ImageIcon size={14} className="text-primary-400" />}
          <span className="truncate flex-1">{file.name}</span>
          <span className="text-gray-600">{(file.size / 1024).toFixed(0)} KB</span>
        </div>
      )}

      {/* Progress bar */}
      {loading && progress > 0 && progress < 100 && (
        <div className="w-full bg-dark-600 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-purple-500 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Detect button */}
      <button
        onClick={handleDetect}
        disabled={!file || loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {progress > 0 && progress < 100 ? `Uploading… ${progress}%` : "Detecting…"}
          </>
        ) : (
          <>
            <Upload size={18} />
            Detect Plate
          </>
        )}
      </button>
    </div>
  );
}
