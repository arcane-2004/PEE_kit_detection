const PPE_ICONS = {
  Helmet: "⛑", Jacket: "🦺",
  Boots: "👢", Goggles: "🥽", Gloves: "🧤"
};

export default function Sidebar({
  detections, safe, frameCount,
  violationCount, violationLog, requiredPPE
}) {
  const detected = detections.map(d => d.class);

  return (
    <div className="flex flex-col gap-4">

      {/* Stats */}
      <div className="bg-[#111317] border border-[#22262f] rounded-xl p-4">
        <p className="font-mono text-[10px] tracking-widest text-slate-500
                      uppercase mb-4">Session Stats</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0a0b0d] border border-[#22262f] rounded-lg p-3 text-center">
            <div className="text-3xl font-bold text-slate-100">{frameCount}</div>
            <div className="font-mono text-[10px] text-slate-600 mt-1">Frames</div>
          </div>
          <div className="bg-[#0a0b0d] border border-red-500/20 rounded-lg p-3 text-center">
            <div className="text-3xl font-bold text-red-400">{violationCount}</div>
            <div className="font-mono text-[10px] text-slate-600 mt-1">Violations</div>
          </div>
        </div>
      </div>

      {/* PPE Status */}
      <div className="bg-[#111317] border border-[#22262f] rounded-xl p-4">
        <p className="font-mono text-[10px] tracking-widest text-slate-500
                      uppercase mb-4">PPE Status</p>
        <div className="flex flex-col gap-1">
          {requiredPPE.map(ppe => {
            const found = detected.includes(ppe);
            const state = frameCount === 0 ? "waiting" : found ? "found" : "missing";
            return (
              <div key={ppe}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg
                  ${state === "found"   ? "bg-green-500/5"
                  : state === "missing" ? "bg-red-500/5"
                  : ""}`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{PPE_ICONS[ppe]}</span>
                  <span className="font-semibold text-sm tracking-wide text-slate-200">
                    {ppe}
                  </span>
                </div>
                <span className={`font-mono text-[10px] px-3 py-1 rounded-full
                  ${state === "found"
                    ? "bg-green-500/15 text-green-400"
                    : state === "missing"
                    ? "bg-red-500/15 text-red-400"
                    : "bg-[#1a1d24] text-slate-600"}`}>
                  {frameCount === 0 ? "—" : found ? "Detected" : "Missing"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live detections */}
      <div className="bg-[#111317] border border-[#22262f] rounded-xl p-4">
        <p className="font-mono text-[10px] tracking-widest text-slate-500
                      uppercase mb-4">Live Detections</p>
        {detections.length === 0 ? (
          <p className="font-mono text-[11px] text-[#374151] text-center py-3">
            No detections
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {detections.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <span className="font-semibold text-sm tracking-wide text-slate-200">
                    {d.class}
                  </span>
                  <div className="h-1 bg-[#22262f] rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${d.confidence * 100}%` }} />
                  </div>
                </div>
                <span className="font-mono text-xs text-slate-500 min-w-[36px] text-right">
                  {(d.confidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent violations */}
      {violationLog.length > 0 && (
        <div className="bg-[#111317] border border-[#22262f] rounded-xl p-4">
          <p className="font-mono text-[10px] tracking-widest text-slate-500
                        uppercase mb-4">Recent Violations</p>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {violationLog.slice(0, 8).map(v => (
              <div key={v.id}
                className="flex flex-col gap-1 px-3 py-2 rounded-lg
                           bg-red-500/5 border border-red-500/10">
                <span className="font-mono text-[10px] text-slate-600">{v.time}</span>
                <span className="text-xs text-red-400">
                  Missing: {v.missing.join(", ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}