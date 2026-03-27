import React from 'react'
import Navbar from "../components/Navbar";
import VideoFeed from "../components/VideoFeed";
import AlertPanel from "../components/AlertPanel";

const Dashboard = () => {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">

			<Navbar />

			<div className="p-6 grid grid-cols-3 gap-6">

				<div className="col-span-2">
					<VideoFeed />
				</div>

				<div>
					<AlertPanel />
				</div>

			</div>
		</div>
	)
}

export default Dashboard
