import { useState } from "react";

export default function ViolationLog() {
  const [log] = useState(
    JSON.parse(localStorage.getItem("ppe_violations") || "[]")
  );

  return (
    <div className="max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-widest text-slate-100 mb-1">
            Violation Log
          </h2>
          <p className="text-sm text-slate-500">
            All PPE violations recorded in this session
          </p>
        </div>
        <span className="font-mono text-xs text-red-400
                         bg-red-500/8 border border-red-500/20
                         px-4 py-2 rounded-full">
          {log.length} violations
        </span>
      </div>

      {log.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24
                        text-slate-600">
          <div className="w-20 h-20 rounded-2xl bg-green-500/5
                          border border-green-500/10 flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7v5c0 5.25 4.25 10.15 10 11.35C17.75 22.15 22 17.25 22 12V7L12 2z"
                stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 12l2 2 4-4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-xl font-semibold tracking-wide">No violations recorded</p>
          <span className="text-sm text-[#374151]">
            Start the live monitor to begin tracking
          </span>
        </div>
      ) : (
        <div className="bg-[#111317] border border-[#22262f] rounded-xl overflow-hidden">

          {/* Table header */}
          <div className="grid grid-cols-[160px_1fr_80px] px-4 py-3
                          bg-[#1a1d24] border-b border-[#22262f]
                          font-mono text-[10px] tracking-widest
                          text-slate-500 uppercase">
            <span>Time</span>
            <span>Missing PPE</span>
            <span className="text-center">Count</span>
          </div>

          {/* Rows */}
          {log.map((v, i) => (
            <div key={i}
              className="grid grid-cols-[160px_1fr_80px] px-4 py-3
                         border-b border-[#22262f] last:border-b-0
                         items-center hover:bg-[#1a1d24] transition-colors">
              <span className="font-mono text-xs text-slate-500">{v.time}</span>
              <div className="flex flex-wrap gap-2">
                {v.missing.map(m => (
                  <span key={m}
                    className="font-mono text-[11px] px-3 py-1 rounded-full
                               bg-red-500/10 text-red-400 border border-red-500/20">
                    {m}
                  </span>
                ))}
              </div>
              <span className="text-2xl font-bold text-red-400 text-center">
                {v.missing.length}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}