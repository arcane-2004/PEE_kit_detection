import React from 'react'
import { useEffect, useState } from "react";

const AlertPanel = () => {
    const [status, setStatus] = useState(null);
    console.log('status', status)
    useEffect(() => {
        const interval = setInterval(() => {
            fetch("http://127.0.0.1:8000/latest_status")
                .then((res) => res.json())
                .then((data) => setStatus(data))
                .catch((err) => console.error(err));
        }, 1000); // every 1 sec

        return () => clearInterval(interval);
    }, []);

    if (!status) return <div>Loading...</div>;

    const isSafe = status.safe;

    return (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-5 rounded-2xl shadow-xl h-full">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">System Status</h2>

                <span className={`px-3 py-1 text-sm rounded-full font-medium
      ${isSafe ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
    `}>
                    {isSafe ? "SAFE" : "UNSAFE"}
                </span>
            </div>

            {/* COUNT */}
            <div className="text-gray-400 mb-4">
                👥 {status.total_persons} persons detected
            </div>

            {/* ALERTS */}
            <div className="space-y-3">
                {status.total_persons === 0 ? (
                    <div className="text-yellow-400 text-sm">
                        No person detected
                    </div>
                ) : isSafe ? (
                    <div className="text-green-400 font-medium">
                        ✅ All compliant
                    </div>
                ) : (
                    status.violations.map((v, i) => (
                        <div
                            key={i}
                            className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-lg"
                        >
                            <strong>Person {v.person_id}</strong>
                            <div className="text-sm mt-1">
                                Missing: {v.missing.join(", ")}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default AlertPanel
