import React from 'react'
import { useState, } from 'react';
import { ImageUp, MonitorPlay } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const Navbar = () => {

	const [isUploading, setIsUploading] = useState(false)

	const navigate = useNavigate();

	return (
		<div className="bg-white/10 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">

			{/* Title */}
			<h1 className="text-xl font-bold tracking-wide">
				🛡️ PPE Detection System
			</h1>

			{/* Navigation Buttons */}
			<div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl">

				{/* Dashboard */}
				<button
					onClick={() => navigate('/dashboard')}
					className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
            ${location.pathname === '/dashboard'
							? "bg-blue-600 text-white shadow-md"
							: "text-gray-300 hover:bg-white/10"
						} hover:cursor-pointer`}
				>
					<MonitorPlay className="w-4 h-4" />
					Live Monitor
				</button>

				{/* Upload */}
				<button
					onClick={() => navigate('/image-feed')}
					className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
            ${location.pathname === '/image-feed'
							? "bg-blue-600 text-white shadow-md"
							: "text-gray-300 hover:bg-white/10"
						} hover:cursor-pointer`}
				>
					<ImageUp className="w-4 h-4" />
					Upload Image
				</button>

			</div>
		</div>
	)
}

export default Navbar
