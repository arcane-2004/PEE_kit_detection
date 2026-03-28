import React from 'react'
import { useState } from 'react'
import { LoaderCircle, Video, VideoOff } from 'lucide-react';
import axios from 'axios'

const VideoFeed = () => {

    const [toggleCamera, setToggleCamera] = useState(false);
    const [loading, setLoading] = useState(false)

    const handleToggleCamera = async () => {
        setLoading(true);

        try{
            await axios.post(`${import.meta.env.VITE_BASE_URL}/toggle_camera`)

            setToggleCamera(!toggleCamera)
        }catch(err){
            console.error(err);
        }finally{
            setLoading(false);
        }
        
    }

    return (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-xl">

            <div className="flex items-center justify-end gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${toggleCamera ? 'bg-green-400 animate-ping' : 'bg-red-400'} `}></span>
                <span className="text-sm text-gray-300">Live Monitoring</span>
            </div>

            {/* VIDEO */}
            <div className="bg-black h-[60vh] rounded-xl overflow-hidden flex items-center justify-center">

                {toggleCamera ? (
                    <img
                        src={`${import.meta.env.VITE_BASE_URL}/video_feed`}
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
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${!toggleCamera
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-red-500 hover:bg-red-600"
                        }${loading && "opacity-60 cursor-not-allowed"} hover:cursor-pointer`}
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
