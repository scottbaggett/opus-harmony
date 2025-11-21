import type React from "react";
import { useState } from "react";
import NoteIdentificationGame from "./components/NoteIdentificationGame";
import SightReadingGame from "./components/SightReadingGame";
import { getCurrentLevelConfig, getNextLevel } from "./core/config/levels";
import { GameState, type TheoryResponse, ViewMode } from "./core/types";
import { getMaestroAdvice } from "./services/geminiService";

const App: React.FC = () => {
	const [gameState, setGameState] = useState<GameState>(GameState.MENU);
	const [gameMode, setGameMode] = useState<"rhythm" | "identification">("identification"); // Default to new mode
	const [score, setScore] = useState(0);
	const [streak, setStreak] = useState(0);
	const [level, setLevel] = useState(1);
	const [advice, setAdvice] = useState<TheoryResponse | null>(null);
	const [loadingAdvice, setLoadingAdvice] = useState(false);
	const [highScore, setHighScore] = useState(0);

	const handleStartGame = (mode: "rhythm" | "identification" = "identification") => {
		setScore(0);
		setStreak(0);
		setLevel(1);
		setGameMode(mode);
		setGameState(GameState.PLAYING);
		setAdvice(null);
	};

	const handleScoreUpdate = (newScore: number, newStreak: number, newLevel: number = 1) => {
		setScore(newScore);
		setStreak(newStreak);
		setLevel(newLevel);
	};

	const handleGameOver = async (finalScore: number) => {
		// If already game over, ignore (prevents double triggers)
		if (gameState === GameState.GAME_OVER) return;

		setGameState(GameState.GAME_OVER);
		if (finalScore > highScore) {
			setHighScore(finalScore);
		}

		// Fetch Advice
		setLoadingAdvice(true);
		try {
			const response = await getMaestroAdvice(
				ViewMode.GAME,
				`Player just lost the sight reading game. Final Score: ${finalScore}. Streak: ${streak}.`
			);
			setAdvice(response);
		} catch (e) {
			console.error("Advice fetch failed", e);
			setAdvice({
				explanation: "Practice makes perfect. Focus on the interval jumps.",
				tip: "Watch the next note before it arrives.",
			});
		} finally {
			setLoadingAdvice(false);
		}
	};

	return (
		<div className="relative w-full h-full bg-[#0f0e11] overflow-hidden text-[#e5e5e5] select-none font-serif">
			{/* GAME LAYER */}
			{gameMode === "rhythm" ? (
				<SightReadingGame
					gameState={gameState}
					onScoreUpdate={handleScoreUpdate}
					onGameOver={handleGameOver}
				/>
			) : (
				<NoteIdentificationGame gameState={gameState} onScoreUpdate={handleScoreUpdate} />
			)}

			{/* --- HUD (Playing) --- */}
			<div
				className={`absolute top-0 left-0 w-full p-8 flex justify-between items-start pointer-events-none transition-opacity duration-500 ${gameState === GameState.PLAYING ? "opacity-100" : "opacity-0"}`}
			>
				<div className="glass-panel px-6 py-3 rounded-full bg-black/30 backdrop-blur border border-white/10">
					<span className="text-sm text-gray-400 uppercase tracking-widest mr-3">
						{gameMode === "rhythm" ? "Allegro" : "Adagio"}
					</span>
					<span className="font-serif text-xl italic">
						{gameMode === "rhythm" ? "Sight Reading" : "Note Journey"}
					</span>
				</div>
				<div className="text-right space-y-1">
					<div className="text-6xl font-light text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]">
						{score.toLocaleString()}
					</div>
					<div
						className={`text-sm font-bold tracking-widest uppercase ${streak > 10 ? "text-yellow-400 animate-pulse" : "text-purple-300"}`}
					>
						{streak > 0 ? `${streak} Note Streak` : "Score"}
					</div>
					{gameMode === "rhythm" ? (
						<div className="text-xs text-gray-500 uppercase tracking-widest">
							Perfect: 200pts • Good: 100pts
						</div>
					) : (
						<div className="text-xs text-gray-400 uppercase tracking-widest space-y-1">
							<div>
								Level {level}: {getCurrentLevelConfig(level).name}
							</div>
							{getNextLevel(level) && (
								<div className="text-purple-400">
									Next: {getCurrentLevelConfig(level).requiredScore - score} pts
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* --- MAIN MENU --- */}
			{gameState === GameState.MENU && (
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20 animate-fade-in">
					<div className="max-w-3xl text-center space-y-8">
						<div className="mb-12 space-y-2">
							<h1 className="text-8xl md:text-9xl tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 drop-shadow-2xl">
								Opus One
							</h1>
							<p className="text-3xl text-purple-200 italic font-light tracking-wide">
								Theory Explorer
							</p>
						</div>

						<div className="flex gap-6">
							<button
								type="button"
								onClick={() => handleStartGame("identification")}
								className="group relative px-12 py-6 bg-transparent overflow-hidden rounded-full transition-all duration-500 hover:scale-105"
							>
								<div className="absolute inset-0 border border-white/20 group-hover:border-purple-400/50 rounded-full transition-colors duration-300"></div>
								<div className="absolute inset-0 bg-white/5 group-hover:bg-purple-900/20 transition-colors duration-300 blur-xl"></div>
								<div className="relative text-center">
									<div className="font-serif text-2xl italic text-gray-100 group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all">
										Note Journey
									</div>
									<div className="text-xs text-gray-500 mt-1 uppercase tracking-widest">
										Learn to Read
									</div>
								</div>
							</button>

							<button
								type="button"
								onClick={() => handleStartGame("rhythm")}
								className="group relative px-12 py-6 bg-transparent overflow-hidden rounded-full transition-all duration-500 hover:scale-105"
							>
								<div className="absolute inset-0 border border-white/20 group-hover:border-amber-400/50 rounded-full transition-colors duration-300"></div>
								<div className="absolute inset-0 bg-white/5 group-hover:bg-amber-900/20 transition-colors duration-300 blur-xl"></div>
								<div className="relative text-center">
									<div className="font-serif text-2xl italic text-gray-100 group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all">
										Rhythm Rush
									</div>
									<div className="text-xs text-gray-500 mt-1 uppercase tracking-widest">
										Test Your Speed
									</div>
								</div>
							</button>
						</div>

						<div className="pt-12 flex items-center justify-center gap-8 text-gray-500 text-sm uppercase tracking-widest">
							<div className="flex items-center gap-2">
								<span className="border border-white/20 w-8 h-8 flex items-center justify-center rounded">
									↑
								</span>
								<span>Ascend</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="border border-white/20 w-8 h-8 flex items-center justify-center rounded">
									↓
								</span>
								<span>Descend</span>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* --- GAME OVER --- */}
			{gameState === GameState.GAME_OVER && (
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md z-30">
					<div className="max-w-xl w-full text-center p-10 border border-white/10 rounded-[3rem] bg-[#17161b] shadow-2xl transform transition-all hover:border-purple-500/30">
						<div className="mb-8">
							<h2 className="text-6xl font-serif text-rose-300 mb-2 italic">Fine</h2>
							<p className="text-gray-500 uppercase tracking-widest text-xs">
								The movement has concluded
							</p>
						</div>

						<div className="grid grid-cols-2 gap-8 border-y border-white/5 py-8 mb-8">
							<div className="text-center">
								<div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Score</div>
								<div className="text-4xl font-serif text-white">{score.toLocaleString()}</div>
							</div>
							<div className="text-center">
								<div className="text-xs text-gray-500 uppercase tracking-widest mb-1">
									High Score
								</div>
								<div className="text-4xl font-serif text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
									{highScore.toLocaleString()}
								</div>
							</div>
						</div>

						{/* Maestro Advice */}
						<div className="min-h-[140px] bg-[#1e1b23] p-6 rounded-2xl text-left relative overflow-hidden group mb-8">
							<div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
							{loadingAdvice ? (
								<div className="flex items-center justify-center h-full text-gray-500 italic animate-pulse">
									<span className="mr-2">✦</span> The Maestro is composing feedback...
								</div>
							) : advice ? (
								<div className="space-y-3 relative z-10">
									<h4 className="text-purple-300 font-serif italic text-lg flex items-center gap-2">
										<span className="text-xl">𝄞</span> Maestro's Critique
									</h4>
									<p className="text-gray-300 leading-relaxed text-lg font-light">
										"{advice.explanation}"
									</p>
									<div className="pt-3 border-t border-white/5">
										<p className="text-xs text-gray-500 uppercase tracking-widest">
											<span className="text-amber-500/80 mr-2">Tip</span> {advice.tip}
										</p>
									</div>
								</div>
							) : (
								<div className="text-center text-gray-600 pt-4">No critique available.</div>
							)}
						</div>

						<div className="flex gap-4">
							<button
								type="button"
								onClick={() => handleStartGame()}
								className="flex-1 py-4 bg-white text-black rounded-xl font-serif text-xl italic hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
							>
								Play Again
							</button>

							<button
								type="button"
								onClick={() => setGameState(GameState.MENU)}
								className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-serif text-xl italic transition-colors border border-white/10"
							>
								Menu
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default App;
