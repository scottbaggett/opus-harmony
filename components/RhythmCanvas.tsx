import React, { useEffect, useRef, useState, useCallback } from "react";
import { INITIAL_RHYTHM_LEVEL, COLORS } from "../constants";
import { Note } from "../types";

const CANVAS_HEIGHT = 400;
const NOTE_SIZE = 50; // Width/Height of diamond
const PIXELS_PER_BEAT = 100;

interface RhythmCanvasProps {
	active: boolean;
}

const RhythmCanvas: React.FC<RhythmCanvasProps> = ({ active }) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const [progress, setProgress] = useState(0); // In pixels
	// Initialize with 0 to match number type
	const requestRef = useRef<number>(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const [score, setScore] = useState(0);
	const [feedback, setFeedback] = useState<string | null>(null);

	const level = INITIAL_RHYTHM_LEVEL;
	const totalWidth = level.notes[level.notes.length - 1].startTime * PIXELS_PER_BEAT + 800;

	const animate = useCallback(
		(time: number) => {
			if (isPlaying) {
				setProgress((prev) => {
					const speed = (level.bpm / 60) * PIXELS_PER_BEAT * 0.016; // Pixels per frame approx
					const nextProgress = prev + speed;
					if (nextProgress > totalWidth) {
						setIsPlaying(false);
						return 0;
					}
					return nextProgress;
				});
				requestRef.current = requestAnimationFrame(animate);
			}
		},
		[isPlaying, level.bpm, totalWidth]
	);

	useEffect(() => {
		if (isPlaying) {
			requestRef.current = requestAnimationFrame(animate);
		} else {
			if (requestRef.current) cancelAnimationFrame(requestRef.current);
		}
		return () => {
			if (requestRef.current) cancelAnimationFrame(requestRef.current);
		};
	}, [isPlaying, animate]);

	const handlePlayPause = () => {
		setIsPlaying(!isPlaying);
	};

	const handleInteraction = () => {
		// Simple hit detection logic
		const playheadX = progress + 200; // Offset by playhead position

		// Find note closest to playhead
		const hitNote = level.notes.find((n: Note) => {
			const noteX = n.startTime * PIXELS_PER_BEAT;
			return Math.abs(noteX - progress) < 40; // Tolerance window
		});

		if (hitNote) {
			setScore((s) => s + 100);
			setFeedback("Perfect");
			setTimeout(() => setFeedback(null), 500);
		} else {
			setFeedback("Miss");
			setTimeout(() => setFeedback(null), 500);
		}
	};

	// Keyboard listener for "Space"
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.code === "Space") {
				e.preventDefault();
				if (!isPlaying) setIsPlaying(true);
				else handleInteraction();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isPlaying, progress]);

	return (
		<div className="w-full relative select-none">
			{/* Info Header */}
			<div className="mb-6 flex justify-between items-end px-4">
				<div>
					<h2 className="text-2xl font-serif italic text-gray-200">Rhythmic Patterns</h2>
					<p className="text-gray-500 text-sm mt-1">
						Visual representation of tempo and meter. Press [SPACE] to strike.
					</p>
				</div>
				<div className="text-right">
					<div className="text-4xl font-light text-purple-300">{score}</div>
					<div className="text-xs text-gray-500 uppercase tracking-widest">Score</div>
				</div>
			</div>

			{/* Canvas Container */}
			<div
				ref={containerRef}
				className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-[#17161b] shadow-2xl"
				style={{ height: CANVAS_HEIGHT }}
			>
				{/* Dynamic Feedback Overlay */}
				{feedback && (
					<div
						className={`absolute top-10 left-1/2 transform -translate-x-1/2 text-2xl font-bold z-20 animate-pulse ${feedback === "Perfect" ? "text-green-400" : "text-red-400"}`}
					>
						{feedback}
					</div>
				)}

				{/* Grid Lines Background */}
				<div className="absolute inset-0 opacity-20 pointer-events-none">
					{Array.from({ length: 20 }).map((_, i) => (
						<div
							key={i}
							className="absolute top-0 bottom-0 border-r border-gray-500"
							style={{
								left: i * PIXELS_PER_BEAT * 4 - (progress % (PIXELS_PER_BEAT * 4)),
							}}
						/>
					))}
				</div>

				{/* Playhead Line */}
				<div className="absolute top-0 bottom-0 left-[200px] w-[2px] bg-rose-400 z-10 shadow-[0_0_10px_rgba(251,113,133,0.8)]"></div>

				{/* Notes Container - Moving Left */}
				<div
					className="absolute top-0 left-[200px] h-full will-change-transform"
					style={{ transform: `translateX(-${progress}px)` }}
				>
					{level.notes.map((note: Note) => {
						const x = note.startTime * PIXELS_PER_BEAT;
						// Center Y based on lane. 4 lanes.
						const y = 100 + note.lane * 60;

						return (
							<div
								key={note.id}
								className="absolute flex items-center justify-center group transition-all duration-300"
								style={{
									left: x,
									top: y,
									width: NOTE_SIZE,
									height: NOTE_SIZE,
									transform: "rotate(45deg)",
								}}
							>
								{/* The Diamond Shape */}
								<div
									className="w-full h-full shadow-lg transition-transform group-hover:scale-110"
									style={{
										backgroundColor: note.color,
										opacity: 0.8,
										boxShadow: `0 0 15px ${note.color}40`,
									}}
								>
									<div className="w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>
								</div>

								{/* Connection Line (if needed for sustained notes) */}
								<div className="absolute w-[1px] h-[400px] bg-white/5 -z-10 pointer-events-none transform -rotate-45"></div>
							</div>
						);
					})}
				</div>

				{/* Vignette Overlay */}
				<div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#0f0e11] via-transparent to-[#0f0e11] z-10"></div>
			</div>

			{/* Controls */}
			<div className="flex justify-center mt-8 gap-4">
				<button
					onClick={handlePlayPause}
					className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-3 rounded-full font-serif italic transition-colors"
				>
					{isPlaying ? "Pause Motion" : "Commence Motion"}
				</button>
				<button className="bg-purple-900/20 hover:bg-purple-900/30 border border-purple-500/30 text-purple-200 px-8 py-3 rounded-full font-serif italic transition-colors">
					Tempo: {level.bpm} Adagio
				</button>
			</div>
		</div>
	);
};

export default RhythmCanvas;
