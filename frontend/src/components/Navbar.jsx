import { NavLink } from "react-router-dom";
import { Car, History, Camera, Gauge } from "lucide-react";

const navItems = [
  { to: "/", icon: Gauge, label: "Dashboard" },
  { to: "/logs", icon: History, label: "Detection Logs" },
  { to: "/webcam", icon: Camera, label: "Live Camera" },
];

export default function Navbar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-dark-800/80 backdrop-blur-md border-r border-white/10 z-50 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
          <Car className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-tight">ANPR System</p>
          <p className="text-xs text-gray-500">Plate Recognition AI</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-primary-600/20 text-primary-400 border border-primary-500/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4.5 h-4.5 ${isActive ? "text-primary-400" : "text-gray-500 group-hover:text-gray-300"}`} size={18} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-gray-600">YOLOv8 + EasyOCR</p>
        <p className="text-xs text-gray-700">v1.0.0</p>
      </div>
    </aside>
  );
}
