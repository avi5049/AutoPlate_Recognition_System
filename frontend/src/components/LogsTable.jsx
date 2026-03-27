import { useState, useMemo } from "react";
import { Trash2, Download, Search, Image as ImgIcon, ChevronUp, ChevronDown } from "lucide-react";
import { deleteLog, exportLogsCSV } from "../api/axios";
import toast from "react-hot-toast";

function ThumbnailModal({ src, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <img src={src} alt="Log" className="max-w-full max-h-full rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

export default function LogsTable({ logs, onDelete, loading }) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortDir, setSortDir] = useState("desc");
  const [modalImg, setModalImg] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const filtered = useMemo(() => {
    let data = [...logs];
    if (search) data = data.filter((l) => l.plate.toLowerCase().includes(search.toLowerCase()));
    if (dateFilter) data = data.filter((l) => l.timestamp.startsWith(dateFilter));
    data.sort((a, b) =>
      sortDir === "desc"
        ? new Date(b.timestamp) - new Date(a.timestamp)
        : new Date(a.timestamp) - new Date(b.timestamp)
    );
    return data;
  }, [logs, search, dateFilter, sortDir]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteLog(id);
      toast.success("Log deleted.");
      onDelete(id);
    } catch {
      toast.error("Failed to delete log.");
    } finally {
      setDeleting(null);
    }
  };

  const handleExport = async () => {
    try {
      const res = await exportLogsCSV();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "anpr_logs.csv";
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("CSV exported!");
    } catch {
      toast.error("Export failed.");
    }
  };

  return (
    <>
      {modalImg && <ThumbnailModal src={modalImg} onClose={() => setModalImg(null)} />}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by plate…"
            className="input-field pl-9 py-2.5 text-sm"
          />
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="input-field py-2.5 text-sm w-40"
        />
        <button onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))} className="btn-secondary flex items-center gap-1.5 text-sm">
          {sortDir === "desc" ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          Time
        </button>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-1.5 text-sm">
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-600">Loading logs…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">No detections found.</div>
      ) : (
        <div className="overflow-x-auto scrollbar-thin rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dark-700 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left">#</th>
                <th className="px-5 py-3 text-left">Plate</th>
                <th className="px-5 py-3 text-left">Timestamp</th>
                <th className="px-5 py-3 text-left">Confidence</th>
                <th className="px-5 py-3 text-left">Image</th>
                <th className="px-5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filtered.map((log, i) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-gray-600">{i + 1}</td>
                  <td className="px-5 py-3">
                    <span className="font-mono font-bold text-primary-400 tracking-widest">{log.plate}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{log.timestamp}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${log.confidence > 0.7 ? "badge-success" : log.confidence > 0.4 ? "badge-warning" : "badge-error"}`}>
                      {Math.round((log.confidence || 0) * 100)}%
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {log.image_b64 ? (
                      <button
                        onClick={() => setModalImg(`data:image/jpeg;base64,${log.image_b64}`)}
                        className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        <img
                          src={`data:image/jpeg;base64,${log.image_b64}`}
                          alt="thumb"
                          className="w-14 h-9 object-cover rounded-lg border border-white/10"
                        />
                      </button>
                    ) : (
                      <ImgIcon size={16} className="text-gray-700" />
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => handleDelete(log.id)}
                      disabled={deleting === log.id}
                      className="btn-danger text-xs py-1.5"
                    >
                      {deleting === log.id ? "…" : <Trash2 size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-700 mt-3">{filtered.length} of {logs.length} records</p>
    </>
  );
}
