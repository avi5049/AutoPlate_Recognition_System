import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Logs from "./pages/Logs";
import WebcamPage from "./pages/WebcamPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Navbar />

        {/* Main content area (offset for fixed sidebar) */}
        <main className="flex-1 ml-64 p-8 max-w-6xl">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/webcam" element={<WebcamPage />} />
          </Routes>
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1a1a24",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "#34d399", secondary: "#1a1a24" } },
          error: { iconTheme: { primary: "#f87171", secondary: "#1a1a24" } },
        }}
      />
    </BrowserRouter>
  );
}
