import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard",  label: "Live Monitor" },
  { to: "/upload",     label: "Upload Image" },
  { to: "/violations", label: "Violation Log" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-[#111317] border-b border-[#22262f]
                       flex items-center justify-between px-7 py-3">

      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30
                        flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7v5c0 5.25 4.25 10.15 10 11.35C17.75 22.15 22 17.25 22 12V7L12 2z"
              fill="#f59e0b" opacity="0.9"/>
            <path d="M9 12l2 2 4-4" stroke="#0a0b0d" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="font-bold text-xl tracking-widest">
          PPE<span className="text-amber-400">GUARD</span>
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all
               ${isActive
                 ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                 : "text-slate-500 hover:text-slate-200 hover:bg-[#1a1d24]"
               }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Status badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
                      bg-green-500/10 border border-green-500/20 text-green-400
                      text-xs font-mono">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        Live Monitoring
      </div>
    </header>
  );
}