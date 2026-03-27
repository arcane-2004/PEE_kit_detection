import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <div className="h-full text-slate-200 flex flex-col ">
      <main className="flex-1 h-full mx-auto w-full">
        <Routes>
          <Route path="/"           element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"  element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}