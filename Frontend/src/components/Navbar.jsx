import React from 'react'

const Navbar = () => {
	return (
		<div className="bg-white/10 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
			<h1 className="text-xl font-bold tracking-wide">
				🛡️ PPE Detection System
			</h1>

			<span className="text-sm text-gray-300">
				Live Monitoring
			</span>
		</div>
	)
}

export default Navbar
