import React from 'react'
import Navbar from '../components/Navbar'
import { useState, useEffect } from 'react'
import { Image, Logs } from 'lucide-react';
import axios from 'axios';

const ImageFeed = () => {

	const [image, setImage] = useState(null);
	const [preview, setPreview] = useState(null);
	const [fileName, setFileName] = useState("");
	const [result, setResult] = useState(null);
	const [isDetecting, setIsDetecting] = useState(false)

	const handleUpload = (e) => {
		const file = e.target.files[0];
		setImage(file);
		setFileName(file.name);
		setPreview(URL.createObjectURL(file));
		setResult(null);
	}

	const handleDetect = async () => {
		if (!image) return;
		const formData = new FormData();
		formData.append("file", image);

		try {
			setIsDetecting(true);
			const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/detect_image`,
				formData,
			)

			setResult(response.data);
			console.log(response.data)
		} catch (err) {
			console.error(err);
		} finally {
			setIsDetecting(false);
		}
	}

	useEffect(() => {
		if (!image) return;

		const url = URL.createObjectURL(image);
		setPreview(url);

		return () => URL.revokeObjectURL(url); // cleanup
	}, [image]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">

			<Navbar />

			<div className="p-6 grid grid-cols-3 gap-6">

				<div className='col-span-2  '>

					<div className="w-full h-[70vh] flex flex-col items-center justify-center 
                border-2 border-dashed border-gray-500/30 rounded-2xl 
                bg-white/5 backdrop-blur-md transition-all duration-300">

						{!preview ? (
							<div className="flex flex-col items-center gap-3 text-gray-400">

								{/* Icon */}
								<div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
									<Image className="w-12 h-12" />
								</div>

								{/* Text */}
								<p className="text-2xl font-medium">
									No image yet
								</p>

								<p className="text-lg text-gray-500">
									Upload an image to preview it here
								</p>
							</div>
						) : (
							<div className="w-full h-full p-2 flex items-center justify-center">
								<img
									src={preview}
									alt="Uploaded"
									className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
								/>
							</div>
						)}
					</div>

					<div className="flex items-center justify-between gap-4 mt-2">

						{/* Upload */}
						{/* =========================
							Action buttons
						========================= */}
						<div className="flex items-center gap-3 px-4 py-3 border border-white/10 rounded-xl bg-white/5 backdrop-blur-md">

							<input
								id="file"
								type="file"
								className="hidden"
								accept="image/*"
								onChange={handleUpload}
							/>

							<label
								htmlFor="file"
								className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-medium rounded-lg cursor-pointer transition"
							>
								Choose File
							</label>

							<p className="text-xs text-gray-400 truncate max-w-[180px]">
								{fileName || "No file selected"}
							</p>
						</div>

						{/* Detect Button */}
						<button
							onClick={handleDetect}
							disabled={!image}
							className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${image
								? "bg-blue-600 hover:bg-blue-700 shadow-md hover:scale-105"
								: "bg-gray-600 cursor-not-allowed opacity-50"} hover:cursor-pointer`}
						>
							Detect
						</button>

					</div>
				</div>

				{/* ================================ */}
				{/* RIGHT SIDE (Results Panel) */}
				{/* ================================ */}
				<div className="col-span-1 h-[70vh] p-5 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-xl shadow-lg flex flex-col">

					{/* Header */}
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-bold text-gray-200 tracking-wide">
							Detection Results
						</h2>

						{result && (
							<span className={`text-sm px-2 py-1 rounded-full ${result.analysis.safe
								? "bg-green-500/20 text-green-400"
								: "bg-red-500/20 text-red-400"}`}>
								{result.analysis.safe ? "Safe" : "Violation"}
							</span>
						)}
					</div>

					{/* Content */}
					{!result ? (
						<div className="flex flex-col items-center justify-center flex-1 text-gray-400 gap-2 -mt-4 ">
							<div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
								<Logs className='h-12 w-12' />
							</div>
							<p className="text-2xl font-medium">No results yet</p>
							<p className="text-lg text-gray-500">
								Run detection to see output
							</p>
						</div>
					) : (
						<div className="flex-1 overflow-y-auto">

							{/* 👥 PERSON COUNT */}
							<div className="text-gray-400 mb-4 text-sm">
								👥 {result.analysis.total_persons} persons detected
							</div>

							{/* 🚨 ALERTS / STATUS */}
							<div className="space-y-3 mr-2">

								{result.analysis.total_persons === 0 ? (
									<div className="text-yellow-400 text-sm">
										⚠️ No person detected
									</div>

								) : result.analysis.safe ? (
									<div className="text-green-400 font-medium">
										✅ All compliant
									</div>

								) : (
									result.analysis.violations.map((v, i) => (
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
					)}
				</div>

			</div>
		</div >
	)
}

export default ImageFeed
