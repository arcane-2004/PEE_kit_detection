import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import ViolationLog from "./pages/VoilationLog";

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0b0d] text-slate-200 flex flex-col">
      <Navbar />
      <main className="flex-1 p-6 max-w-[1500px] mx-auto w-full">
        <Routes>
          <Route path="/"           element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/upload"     element={<Upload />} />
          <Route path="/violations" element={<ViolationLog />} />
        </Routes>
      </main>
    </div>
  );
}