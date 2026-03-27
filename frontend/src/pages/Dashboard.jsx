import { useState } from "react";
import UploadPanel from "../components/UploadPanel";
import ResultCard from "../components/ResultCard";
import { Car, Activity, Clock, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const [result, setResult] = useState(null);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">Upload an image or video to detect license plates instantly.</p>
      </div>

      {/* Info stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Car, label: "AI Model", value: "YOLOv8", color: "from-primary-500 to-purple-600", glow: "shadow-primary-500/20" },
          { icon: Activity, label: "OCR Engine", value: "EasyOCR", color: "from-emerald-500 to-teal-600", glow: "shadow-emerald-500/20" },
          { icon: CheckCircle, label: "Use Cases", value: "Parking · Toll · Gate", color: "from-orange-500 to-pink-600", glow: "shadow-orange-500/20" },
        ].map(({ icon: Icon, label, value, color, glow }) => (
          <div key={label} className="stat-card">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg ${glow}`}>
              <Icon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="font-semibold text-white text-sm">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UploadPanel onResult={setResult} />
        <div>
          {result ? (
            <ResultCard result={result} />
          ) : (
            <div className="glass-card h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-dark-600 border border-white/10 flex items-center justify-center mb-4">
                <Clock size={28} className="text-gray-600" />
              </div>
              <p className="text-gray-500 font-medium">Awaiting Detection</p>
              <p className="text-gray-700 text-sm mt-1">Upload a file to see results here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline flow diagram */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Processing Pipeline</h3>
        <div className="flex flex-wrap items-center gap-2">
          {["Input File", "YOLOv8 Detection", "Crop Plate", "Grayscale + 2× Upscale", "EasyOCR", "Text Cleaning", "Result"].map(
            (step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  i === 0 ? "bg-primary-500/15 border-primary-500/30 text-primary-400"
                  : i === arr.length - 1 ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : "bg-dark-600 border-white/10 text-gray-400"
                }`}>
                  {step}
                </div>
                {i < arr.length - 1 && <span className="text-gray-700 text-xs">→</span>}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
