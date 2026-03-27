import { useEffect, useState } from "react";
import { History, RefreshCw } from "lucide-react";
import { getLogs } from "../api/axios";
import LogsTable from "../components/LogsTable";
import toast from "react-hot-toast";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getLogs();
      setLogs(res.data.logs || []);
    } catch {
      toast.error("Failed to load logs. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleDelete = (id) => setLogs((prev) => prev.filter((l) => l.id !== id));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Detection Logs</h1>
          <p className="text-gray-500 mt-1 text-sm">Full history of all detected license plates.</p>
        </div>
        <button onClick={fetchLogs} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary bar */}
      <div className="glass-card p-4 flex items-center gap-4">
        <div className="w-9 h-9 rounded-lg bg-primary-500/15 border border-primary-500/30 flex items-center justify-center">
          <History size={16} className="text-primary-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{logs.length} Total Detections</p>
          <p className="text-xs text-gray-600">
            {logs.length > 0 ? `Latest: ${logs[0]?.timestamp}` : "No records yet."}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card p-6">
        <LogsTable logs={logs} onDelete={handleDelete} loading={loading} />
      </div>
    </div>
  );
}
