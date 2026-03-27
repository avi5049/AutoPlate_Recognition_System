import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 min for video processing
});

// ─── Detection ───────────────────────────────────────────────────
export const detectPlate = (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/detect", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
};

// ─── Logs ─────────────────────────────────────────────────────────
export const getLogs = () => api.get("/logs");

export const deleteLog = (id) => api.delete(`/logs/${id}`);

export const exportLogsCSV = () =>
  api.get("/logs/export", { responseType: "blob" });

export default api;
