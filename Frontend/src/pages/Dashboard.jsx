import { useState, useRef, useCallback, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { detectFrame, checkHealth } from "../api";

const REQUIRED_PPE = ["Helmet", "Jacket", "Boots", "Goggles"];

export default function Dashboard() {
  const videoRef   = useRef(null);
  const streamRef  = useRef(null);
  const runningRef = useRef(false);
  const lastTime   = useRef(performance.now());

  const [mode, setMode]             = useState("idle");
  const [annotatedImg, setImg]      = useState(null);
  const [detections, setDetections] = useState([]);
  const [safe, setSafe]             = useState(null);
  const [fps, setFps]               = useState(null);
  const [frameCount, setFrameCount] = useState(0);
  const [violationCount, setVCount] = useState(0);
  const [violationLog, setVLog]     = useState([]);
  const [apiStatus, setApiStatus]   = useState("checking");
  const [error, setError]           = useState(null);

  // Check Node + FastAPI health on mount
  useEffect(() => {
    checkHealth()
      .then(d => setApiStatus(d.online ? "online" : "error"))
      .catch(() => setApiStatus("error"));
  }, []);

  function handleResult(data) {
    setImg(data.image);
    setDetections(data.detections || []);
    setSafe(data.safe);
    setError(null);
    setFrameCount(c => c + 1);

    if (data.violations?.length > 0) {
      setVCount(c => c + 1);
      const entry = {
        time: new Date().toLocaleTimeString(),
        missing: data.violations,
        id: Date.now()
      };
      setVLog(log => [entry, ...log].slice(0, 30));

      // Persist to localStorage for ViolationLog page
      const stored = JSON.parse(localStorage.getItem("ppe_violations") || "[]");
      localStorage.setItem("ppe_violations",
        JSON.stringify([entry, ...stored].slice(0, 100))
      );
    }
  }

  const sendFrame = useCallback(async () => {
    if (!runningRef.current) return;

    const video = videoRef.current;
    const off   = document.createElement("canvas");
    off.width   = video.videoWidth  || 640;
    off.height  = video.videoHeight || 480;
    off.getContext("2d").drawImage(video, 0, 0);
    const base64 = off.toDataURL("image/jpeg", 0.75).split(",")[1];

    try {
      const data = await detectFrame(base64);
      handleResult(data);

      const now = performance.now();
      setFps((1000 / (now - lastTime.current)).toFixed(1));
      lastTime.current = now;
    } catch (e) {
      setError("Node server unreachable — is it running on port 3001?");
    }

    requestAnimationFrame(sendFrame);
  }, []);

  async function startCamera() {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      runningRef.current = true;
      setMode("live");
      sendFrame();
    } catch {
      setError("Camera access denied — please allow camera permissions.");
    }
  }

  function stopCamera() {
    runningRef.current = false;
    streamRef.current?.getTracks().forEach(t => t.stop());
    setMode("idle");
    setImg(null);
    setFps(null);
    setSafe(null);
  }

  function resetSession() {
    stopCamera();
    setDetections([]);
    setFrameCount(0);
    setVCount(0);
    setVLog([]);
    setSafe(null);
    setError(null);
  }

  return (
    <div className="grid grid-cols-[1fr_360px] gap-5 max-xl:grid-cols-1">

      {/* Feed panel */}
      <div className="bg-[#111317] border border-[#22262f] rounded-xl
                      flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3
                        border-b border-[#22262f]">
          <div className="flex items-center gap-2 font-mono text-xs
                          text-slate-500 tracking-wider">
            <span className={`w-2 h-2 rounded-full
              ${mode === "live" ? "bg-red-500 animate-pulse" : "bg-[#22262f]"}`} />
            {mode === "live" ? "LIVE FEED" : "CAMERA FEED"}
          </div>

          <div className="flex items-center gap-2">
            {/* API status */}
            <span className={`font-mono text-[10px] px-3 py-1 rounded-full border
              ${apiStatus === "online"
                ? "text-green-400 bg-green-500/10 border-green-500/20"
                : apiStatus === "error"
                ? "text-red-400 bg-red-500/10 border-red-500/20"
                : "text-amber-400 bg-amber-500/10 border-amber-500/20"}`}>
              {apiStatus === "online" ? "Model Online"
               : apiStatus === "error" ? "Model Offline"
               : "Checking..."}
            </span>

            {fps && (
              <span className="font-mono text-xs text-green-400
                               bg-green-500/10 border border-green-500/20
                               px-3 py-1 rounded-full">
                {fps} FPS
              </span>
            )}

            {safe !== null && (
              <span className={`font-bold text-xs tracking-widest
                               px-4 py-1.5 rounded-full border
                ${safe
                  ? "text-green-400 bg-green-500/10 border-green-500/20"
                  : "text-red-400 bg-red-500/10 border-red-500/20 animate-pulse"}`}>
                {safe ? "ALL PPE OK" : "VIOLATION"}
              </span>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mt-3 px-4 py-3 rounded-lg
                          bg-red-500/10 border border-red-500/20
                          text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Feed area */}
        <div className="flex-1 min-h-[420px] bg-[#050607] relative overflow-hidden">
          <video ref={videoRef} muted playsInline
            className={`w-full h-full object-contain
              ${mode === "live" && !annotatedImg ? "block" : "hidden"}`} />

          {annotatedImg ? (
            <img className="w-full h-full object-contain block"
              src={`data:image/jpeg;base64,${annotatedImg}`}
              alt="detection result" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center
                            justify-center gap-4 text-slate-600">
              <div className="w-20 h-20 rounded-2xl bg-amber-500/5
                              border border-amber-500/10
                              flex items-center justify-center">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M23 7l-7 5 7 5V7z" stroke="#f59e0b" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="1" y="5" width="15" height="14" rx="2"
                    stroke="#f59e0b" strokeWidth="1.5"/>
                </svg>
              </div>
              <p className="text-base font-semibold tracking-wide">
                Start camera to begin detection
              </p>
              <p className="text-xs text-[#374151]">
                Make sure Node server is running on port 3001
              </p>
            </div>
          )}

          {/* Scanline overlay */}
          {mode === "live" && (
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(245,158,11,0.012) 2px, rgba(245,158,11,0.012) 4px)"
            }} />
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3 px-4 py-3 border-t border-[#22262f]">
          {mode !== "live" ? (
            <button onClick={startCamera}
              className="px-5 py-2 rounded-lg bg-amber-400 text-black
                         font-bold text-sm tracking-wide
                         hover:bg-amber-300 transition-all hover:-translate-y-px">
              Start Camera
            </button>
          ) : (
            <button onClick={stopCamera}
              className="px-5 py-2 rounded-lg bg-red-500 text-white
                         font-bold text-sm tracking-wide
                         hover:bg-red-400 transition-all hover:-translate-y-px">
              Stop
            </button>
          )}
          <button onClick={resetSession}
            className="px-5 py-2 rounded-lg border border-[#22262f]
                       text-slate-500 font-bold text-sm tracking-wide
                       hover:text-slate-200 hover:border-slate-500
                       transition-all hover:-translate-y-px">
            Reset Session
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        detections={detections}
        safe={safe}
        frameCount={frameCount}
        violationCount={violationCount}
        violationLog={violationLog}
        requiredPPE={REQUIRED_PPE}
      />
    </div>
  );
}