import { useState, useRef } from "react";
import { detectImage } from "../api";

export default function Upload() {
  const fileInput   = useRef(null);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError]       = useState(null);
  const [preview, setPreview]   = useState(null);

  async function detect(file) {
    setLoading(true);
    setResult(null);
    setError(null);

    // Show local preview while loading
    setPreview(URL.createObjectURL(file));

    try {
      const data = await detectImage(file);
      setResult(data);
      setPreview(null); // replace with annotated result
    } catch (e) {
      setError("Detection failed — is the Node server running on port 3001?");
    } finally {
      setLoading(false);
    }
  }

  function handleFile(file) {
    if (file?.type.startsWith("image/")) detect(file);
    else setError("Please upload a valid image file (JPG or PNG).");
  }

  function reset() {
    setResult(null);
    setPreview(null);
    setError(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <div className="grid grid-cols-[420px_1fr] gap-6 items-start max-lg:grid-cols-1">

      {/* Left panel */}
      <div>
        <h2 className="text-3xl font-bold tracking-widest text-slate-100 mb-1">
          Image Analysis
        </h2>
        <p className="text-sm text-slate-500 mb-5">
          Upload a construction site image to detect PPE compliance
        </p>

        {/* Dropzone */}
        <div
          onClick={() => fileInput.current.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          className={`border-2 border-dashed rounded-xl p-12 text-center
                      cursor-pointer flex flex-col items-center gap-3 transition-all
                      ${dragging
                        ? "border-amber-400 bg-amber-500/5"
                        : "border-[#22262f] bg-[#111317] hover:border-amber-500/40 hover:bg-amber-500/5"
                      }`}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-[#22262f] border-t-amber-400
                              rounded-full animate-spin" />
              <span className="text-xs font-mono text-slate-500 tracking-wider">
                Analyzing image...
              </span>
            </div>
          ) : (
            <>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                  stroke="#f59e0b" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="font-semibold text-base text-slate-200 tracking-wide">
                Drop image here or click to browse
              </p>
              <p className="text-xs text-slate-600">JPG, PNG — max 10MB</p>
            </>
          )}
        </div>

        <input ref={fileInput} type="file" accept="image/*"
          className="hidden" onChange={e => handleFile(e.target.files[0])} />

        {/* Error */}
        {error && (
          <div className="mt-4 px-4 py-3 rounded-lg
                          bg-red-500/10 border border-red-500/20
                          text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Result info */}
        {result && (
          <div className="mt-5">

            {/* Verdict banner */}
            <div className={`font-bold text-sm tracking-widest px-4 py-3
                             rounded-lg mb-4 border
              ${result.safe
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
              {result.safe
                ? "✓ ALL PPE COMPLIANT"
                : `✗ VIOLATION — Missing: ${result.violations.join(", ")}`}
            </div>

            {/* Detections grid */}
            {result.detections.length > 0 && (
              <>
                <p className="font-mono text-[10px] tracking-widest
                               text-slate-500 uppercase mb-3">
                  Detected Items
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {result.detections.map((d, i) => (
                    <div key={i}
                      className="flex justify-between items-center
                                 bg-[#1a1d24] border border-[#22262f]
                                 rounded-lg px-3 py-2">
                      <span className="font-semibold text-sm
                                       text-slate-200 tracking-wide">
                        {d.class}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-[#22262f] rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${d.confidence * 100}%` }} />
                        </div>
                        <span className="font-mono text-xs text-amber-400 min-w-[32px]">
                          {(d.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Reset button */}
            <button onClick={reset}
              className="w-full py-2 rounded-lg border border-[#22262f]
                         text-slate-500 font-bold text-sm tracking-wide
                         hover:text-slate-200 hover:border-slate-500 transition-all">
              Analyze Another Image
            </button>
          </div>
        )}
      </div>

      {/* Right: annotated image */}
      <div className="bg-[#111317] border border-[#22262f] rounded-xl
                      min-h-[500px] flex items-center justify-center overflow-hidden
                      relative">

        {/* Loading overlay */}
        {loading && preview && (
          <>
            <img className="w-full h-full object-contain block opacity-40"
              src={preview} alt="preview" />
            <div className="absolute inset-0 flex flex-col items-center
                            justify-center gap-3">
              <div className="w-10 h-10 border-2 border-[#22262f]
                              border-t-amber-400 rounded-full animate-spin" />
              <span className="font-mono text-xs text-amber-400 tracking-wider">
                Running YOLO11 inference...
              </span>
            </div>
          </>
        )}

        {/* Annotated result */}
        {result?.image && !loading && (
          <img className="w-full h-full object-contain block"
            src={`data:image/jpeg;base64,${result.image}`}
            alt="Annotated result" />
        )}

        {/* Empty state */}
        {!result && !loading && (
          <div className="flex flex-col items-center gap-3 text-[#374151]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2"
                stroke="#374151" strokeWidth="1.5"/>
              <circle cx="8.5" cy="8.5" r="1.5" stroke="#374151" strokeWidth="1.5"/>
              <path d="M21 15l-5-5L5 21" stroke="#374151" strokeWidth="1.5"
                strokeLinecap="round"/>
            </svg>
            <p className="font-mono text-xs">Annotated result will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}