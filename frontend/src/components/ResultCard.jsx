import { CheckCircle2, XCircle, ZoomIn } from "lucide-react";
import { useState } from "react";

function PlateDisplay({ plate }) {
  return (
    <div className="text-center py-4">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Detected Plate</p>
      <div className="inline-block bg-dark-600 border-2 border-primary-500/40 rounded-xl px-8 py-4 shadow-lg shadow-primary-500/10">
        <span className="text-3xl font-black text-gradient tracking-[0.2em]">{plate}</span>
      </div>
    </div>
  );
}

function ImageModal({ src, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <img
        src={src}
        alt="Full annotated"
        className="max-w-full max-h-full rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function ResultCard({ result }) {
  const [modalImg, setModalImg] = useState(null);

  if (!result) return null;

  if (!result.success || result.detections.length === 0) {
    return (
      <div className="glass-card p-6 animate-slide-up">
        <div className="flex items-center gap-3 text-red-400">
          <XCircle size={22} />
          <p className="font-semibold">No Plate Detected</p>
        </div>
        <p className="text-sm text-gray-500 mt-2">{result.message}</p>
      </div>
    );
  }

  return (
    <>
      {modalImg && <ImageModal src={modalImg} onClose={() => setModalImg(null)} />}
      <div className="glass-card p-6 space-y-5 animate-slide-up">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={22} className="text-emerald-400" />
          <h3 className="font-semibold text-white">
            {result.detections.length} Plate{result.detections.length > 1 ? "s" : ""} Detected
          </h3>
          <span className="ml-auto text-xs text-gray-600">{result.timestamp}</span>
        </div>

        {result.detections.map((det, i) => (
          <div key={det.id || i} className="border border-white/10 rounded-xl overflow-hidden">
            {/* Annotated image */}
            {det.image_b64 && (
              <div className="relative group cursor-pointer" onClick={() => setModalImg(`data:image/jpeg;base64,${det.image_b64}`)}>
                <img
                  src={`data:image/jpeg;base64,${det.image_b64}`}
                  alt="annotated"
                  className="w-full max-h-64 object-contain bg-dark-900"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn size={28} className="text-white" />
                </div>
              </div>
            )}

            <div className="p-4">
              <PlateDisplay plate={det.plate} />

              {/* Metadata row */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <div>
                  <p className="text-xs text-gray-600">Confidence</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 w-24 bg-dark-600 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${det.confidence > 0.7 ? "bg-emerald-500" : det.confidence > 0.4 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${Math.round((det.confidence || 0) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{Math.round((det.confidence || 0) * 100)}%</span>
                  </div>
                </div>

                {det.bbox && (
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Bounding Box</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      ({det.bbox.x1},{det.bbox.y1}) → ({det.bbox.x2},{det.bbox.y2})
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
