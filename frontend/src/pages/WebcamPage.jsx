import WebcamPanel from "../components/WebcamPanel";

export default function WebcamPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Live Camera</h1>
        <p className="text-gray-500 mt-1 text-sm">Capture from your webcam and detect plates in real-time.</p>
      </div>
      <WebcamPanel />
    </div>
  );
}
