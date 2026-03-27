import React from 'react'
import { useState } from 'react'
import { LoaderCircle, Video, VideoOff } from 'lucide-react';

const VideoFeed = () => {

    const [toggleCamera, setToggleCamera] = useState(false);
    const [loading, setLoading] = useState(false)

    const handleToggleCamera = () => {
        setLoading(true);

        fetch("http://127.0.0.1:8000/toggle_camera", { method: "POST" })
            .then((res) => res.json())
            .then(() => setToggleCamera(!toggleCamera))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }

    return (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-xl">

            {/* VIDEO */}
            <div className="bg-black h-[60vh] rounded-xl overflow-hidden flex items-center justify-center">

                {toggleCamera ? (
                    <img
                        src="http://127.0.0.1:8000/video_feed"
                        alt="Live Feed"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-gray-300">
                            Camera is Off
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Start camera to view live feed
                        </p>
                    </div>
                )}

            </div>

            {/* BUTTON */}
            <div className="flex justify-center mt-5">
                <button
                    onClick={handleToggleCamera}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300
        ${!toggleCamera
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-red-500 hover:bg-red-600"
                        }
        ${loading && "opacity-60 cursor-not-allowed"}
      `}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <LoaderCircle className="animate-spin w-5 h-5" />
                            Processing...
                        </>
                    ) : !toggleCamera ? (
                        <>
                            <Video className="w-5 h-5" />
                            Start Camera
                        </>
                    ) : (
                        <>
                            <VideoOff className="w-5 h-5" />
                            Stop Camera
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}

export default VideoFeed
