import { Application, BlurFilter, Container, Graphics, Text } from "pixi.js";
import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { GameState } from "../types";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";
import { soundEngine } from "../services/soundEngine";
import { LEVELS, getCurrentLevelConfig, getNextLevel } from "../config/levels";

// Register PixiPlugin
gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI({ Container, Graphics, Text });

interface NoteIdentificationGameProps {
	gameState: GameState;
	onScoreUpdate: (score: number, streak: number, level: number) => void;
	onGameOver?: (finalScore: number) => void;
}

// Note definitions with colors
const TREBLE_NOTES = [
	{ name: "E", position: 0, color: 0xe079a4, displayName: "E4" }, // Bottom line
	{ name: "F", position: 1, color: 0xe13ebe, displayName: "F4" }, // First space
	{ name: "G", position: 2, color: 0xb7383b, displayName: "G4" }, // Second line
	{ name: "A", position: 3, color: 0x8e4e11, displayName: "A4" }, // Second space
	{ name: "B", position: 4, color: 0xd17d77, displayName: "B4" }, // Middle line
	{ name: "C", position: 5, color: 0x875963, displayName: "C5" }, // Third space
	{ name: "D", position: 6, color: 0x832f14, displayName: "D5" }, // Fourth line
];

const STAFF_LINE_SPACING = 60;

const NoteIdentificationGame: FC<NoteIdentificationGameProps> = ({ gameState, onScoreUpdate }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const appRef = useRef<Application | null>(null);
	const [isReady, setIsReady] = useState(false);

	// Game state
	const [level, setLevel] = useState(1);
	const [availableNotes, setAvailableNotes] = useState<typeof TREBLE_NOTES>([]);
	const [currentNote, setCurrentNote] = useState<(typeof TREBLE_NOTES)[0] | null>(null);
	const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
	const [showLevelUp, setShowLevelUp] = useState(false);

	const scoreRef = useRef(0);
	const streakRef = useRef(0);
	const currentNoteGraphicRef = useRef<Container | null>(null);
	const feedbackLayerRef = useRef<Container | null>(null);

	const gameStateRef = useRef(gameState);
	useEffect(() => {
		gameStateRef.current = gameState;

		if (gameState === GameState.PLAYING) {
			scoreRef.current = 0;
			streakRef.current = 0;
			setLevel(1);
			setFeedback(null);
			setCurrentNote(null); // Reset current note to trigger new note generation

			// Initialize sound engine on first play
			soundEngine.init().catch((err) => console.error("Failed to init audio:", err));
		}
	}, [gameState]);

	// Update available notes based on level configuration
	useEffect(() => {
		const levelConfig = getCurrentLevelConfig(level);
		const notesForLevel = TREBLE_NOTES.filter((n) => levelConfig.availableNotes.includes(n.position));
		setAvailableNotes(notesForLevel);
		console.log(`Level ${level}: ${levelConfig.name}`, notesForLevel);
	}, [level]);

	// Generate new note when available notes change or game starts
	useEffect(() => {
		console.log("Note generation check:", {
			gameState,
			level,
			availableNotes: availableNotes.map(n => n.name),
			hasCurrentNote: !!currentNote,
		});
		if (gameState === GameState.PLAYING && availableNotes.length > 0 && !currentNote) {
			console.log("Generating new note from:", availableNotes.map(n => n.name));
			const randomNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
			console.log("Selected note:", randomNote);
			setCurrentNote(randomNote);
		}
	}, [gameState, level, availableNotes.length, currentNote]);

	const createNewNote = useCallback(() => {
		if (availableNotes.length === 0) return;
		const randomNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
		setCurrentNote(randomNote);
	}, [availableNotes]);

	// Initialize PixiJS
	useEffect(() => {
		let app: Application | null = null;
		let destroyed = false;

		const initPixi = async () => {
			app = new Application();

			await app.init({
				resizeTo: window,
				antialias: true,
				backgroundAlpha: 0,
				resolution: window.devicePixelRatio || 1,
				autoDensity: true,
			});

			if (destroyed) {
				await app.destroy({ removeView: true });
				return;
			}

			if (containerRef.current) {
				containerRef.current.appendChild(app.canvas);
			}
			appRef.current = app;

			// Create layers
			const staffLayer = new Container();
			const noteLayer = new Container();
			const feedbackLayer = new Container();

			app.stage.addChild(staffLayer);
			app.stage.addChild(noteLayer);
			app.stage.addChild(feedbackLayer);

			feedbackLayerRef.current = feedbackLayer;

			// Draw staff
			const centerY = app.screen.height / 2;
			const startY = centerY - 2 * STAFF_LINE_SPACING;

			// Staff glow
			const staffGlow = new Graphics();
			staffGlow.rect(0, startY - 20, app.screen.width, STAFF_LINE_SPACING * 4 + 40);
			staffGlow.fill({ color: 0x000000, alpha: 0.3 });
			const blur = new BlurFilter();
			blur.strength = 10;
			staffGlow.filters = [blur];
			staffLayer.addChild(staffGlow);

			// Draw 5 staff lines
			for (let i = 0; i < 5; i++) {
				const line = new Graphics();
				line.moveTo(200, 0);
				line.lineTo(app.screen.width - 200, 0);
				line.stroke({ width: 2, color: 0x666666 });
				line.y = startY + i * STAFF_LINE_SPACING;
				staffLayer.addChild(line);
			}

			// Treble clef
			const clefText = new Text({
				text: "𝄞",
				style: {
					fontFamily: "EB Garamond",
					fontSize: 280,
					fill: 0xe5e5e5,
				},
			});
			clefText.x = 240;
			// The G line is the second line from bottom (startY + STAFF_LINE_SPACING)
			// Position clef so its curl wraps around this line
			clefText.y = startY + STAFF_LINE_SPACING - 95;
			staffLayer.addChild(clefText);

			setIsReady(true);
		};

		initPixi();

		return () => {
			destroyed = true;
			setIsReady(false);
			if (appRef.current) {
				appRef.current.destroy({ removeView: true });
				appRef.current = null;
			}
		};
	}, []);

	// Draw current note on canvas
	useEffect(() => {
		console.log("Note draw effect triggered:", {
			isReady,
			hasApp: !!appRef.current,
			currentNote,
			gameState,
		});
		if (!isReady || !appRef.current || !currentNote || gameState !== GameState.PLAYING) return;

		console.log("Drawing note:", currentNote);
		const app = appRef.current;
		const noteLayer = app.stage.children[1] as Container;

		// Clear previous note
		if (currentNoteGraphicRef.current) {
			currentNoteGraphicRef.current.destroy({ children: true });
		}

		const centerY = app.screen.height / 2;
		const startY = centerY - 2 * STAFF_LINE_SPACING;

		// Calculate note Y position
		const noteY = startY + 4 * STAFF_LINE_SPACING - currentNote.position * (STAFF_LINE_SPACING / 2);

		const noteContainer = new Container();
		noteContainer.x = app.screen.width / 2;
		noteContainer.y = noteY;

		// Glow effect
		const glow = new Graphics();
		glow.circle(0, 0, 40);
		glow.fill({ color: currentNote.color, alpha: 0.3 });
		const glowBlur = new BlurFilter({ strength: 20 });
		glow.filters = [glowBlur];
		noteContainer.addChild(glow);

		// Note head (hollow)
		const noteHead = new Graphics();
		noteHead.ellipse(0, 0, 24, 18);
		noteHead.fill(currentNote.color);
		noteHead.rotation = -0.3;
		noteContainer.addChild(noteHead);

		// Inner hollow circle
		const hollow = new Graphics();
		hollow.ellipse(0, 0, 14, 10);
		hollow.fill(0x0f0e11);
		hollow.rotation = -0.3;
		noteContainer.addChild(hollow);

		// Stem
		const stem = new Graphics();
		stem.moveTo(22, 0);
		stem.lineTo(22, -70);
		stem.stroke({ width: 3, color: currentNote.color });
		noteContainer.addChild(stem);

		// Ledger line for C (position 5)
		if (currentNote.position === 5) {
			const ledger = new Graphics();
			ledger.moveTo(-40, 0);
			ledger.lineTo(40, 0);
			ledger.stroke({ width: 2, color: 0x666666 });
			noteContainer.addChild(ledger);
		}

		// Animate entrance with GSAP
		noteContainer.scale.set(0);
		noteContainer.alpha = 0;

		noteLayer.addChild(noteContainer);
		currentNoteGraphicRef.current = noteContainer;

		// Bouncy entrance animation
		gsap.to(noteContainer.scale, {
			x: 1,
			y: 1,
			duration: 0.6,
			ease: "back.out(1.7)",
		});

		gsap.to(noteContainer, {
			pixi: { alpha: 1 },
			duration: 0.3,
			ease: "power2.out",
		});

		// Subtle breathing animation
		gsap.to(glow, {
			pixi: { alpha: 0.5 },
			duration: 1.5,
			repeat: -1,
			yoyo: true,
			ease: "sine.inOut",
		});

		// Play the note sound when it appears
		soundEngine.playNote(currentNote.displayName, "2n");
	}, [currentNote, isReady, gameState]);

	// Feedback visual effect
	useEffect(() => {
		if (!isReady || !appRef.current || !feedbackLayerRef.current) return;

		const app = appRef.current;
		const feedbackLayer = feedbackLayerRef.current;

		// Clear previous feedback and kill any ongoing animations
		gsap.killTweensOf(feedbackLayer.children);
		feedbackLayer.removeChildren();

		if (feedback) {
			if (feedback === "correct") {
				// Success: Radial burst effect
				const particles: Graphics[] = [];
				const particleCount = 12;
				const centerX = app.screen.width / 2;
				const centerY = app.screen.height / 2;

				for (let i = 0; i < particleCount; i++) {
					const particle = new Graphics();
					particle.circle(0, 0, 15);
					particle.fill({ color: 0x22c55e, alpha: 0.7 });
					particle.x = centerX;
					particle.y = centerY;
					feedbackLayer.addChild(particle);
					particles.push(particle);

					const angle = (Math.PI * 2 * i) / particleCount;
					const distance = 200;

					gsap.to(particle, {
						pixi: {
							x: centerX + Math.cos(angle) * distance,
							y: centerY + Math.sin(angle) * distance,
							alpha: 0,
							scale: 0.5,
						},
						duration: 0.6,
						ease: "power2.out",
						onComplete: () => {
							particle.destroy();
						},
					});
				}

				// Gentle green flash overlay
				const overlay = new Graphics();
				overlay.rect(0, 0, app.screen.width, app.screen.height);
				overlay.fill({ color: 0x22c55e, alpha: 0 });
				feedbackLayer.addChild(overlay);

				gsap
					.timeline()
					.to(overlay, {
						pixi: { alpha: 0.1 },
						duration: 0.15,
						ease: "power2.out",
					})
					.to(overlay, {
						pixi: { alpha: 0 },
						duration: 0.4,
						ease: "power2.in",
						onComplete: () => {
							overlay.destroy();
						},
					});
			} else {
				// Incorrect: Quick red flash
				const overlay = new Graphics();
				overlay.rect(0, 0, app.screen.width, app.screen.height);
				overlay.fill({ color: 0xef4444, alpha: 0 });
				feedbackLayer.addChild(overlay);

				gsap
					.timeline()
					.to(overlay, {
						pixi: { alpha: 0.2 },
						duration: 0.08,
						ease: "power2.out",
					})
					.to(overlay, {
						pixi: { alpha: 0 },
						duration: 0.3,
						ease: "power2.in",
						onComplete: () => {
							feedbackLayer.removeChildren();
						},
					});
			}
		}
	}, [feedback, isReady]);

	// Keyboard input handler
	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			if (gameStateRef.current !== GameState.PLAYING || feedback !== null || !currentNote) return;

			const key = e.key.toUpperCase();
			const validNotes = availableNotes.map((n) => n.name);

			if (validNotes.includes(key)) {
				handleNoteSelection(key);
			}
		};

		window.addEventListener("keypress", handleKeyPress);
		return () => window.removeEventListener("keypress", handleKeyPress);
	}, [availableNotes, currentNote, feedback]);

	const handleNoteSelection = (selectedNote: string) => {
		if (!currentNote || feedback !== null) return;

		console.log("Note selected:", selectedNote, "Current note:", currentNote.name);

		if (selectedNote === currentNote.name) {
			// Correct!
			setFeedback("correct");
			scoreRef.current += 10;
			streakRef.current += 1;

			// Play success sound - major 7th chord based on the note that was hit
			soundEngine.playSuccess(currentNote.displayName);

			// Animate note exit (success)
			if (currentNoteGraphicRef.current) {
				gsap.to(currentNoteGraphicRef.current.scale, {
					x: 1.3,
					y: 1.3,
					duration: 0.3,
					ease: "back.out(2)",
				});
				gsap.to(currentNoteGraphicRef.current, {
					pixi: { alpha: 0 },
					duration: 0.3,
					ease: "power2.in",
				});
			}

			// Check for level up based on score
			const currentLevelConfig = getCurrentLevelConfig(level);
			const nextLevelConfig = getNextLevel(level);

			if (nextLevelConfig && scoreRef.current >= currentLevelConfig.requiredScore) {
				console.log(`Level up! ${level} → ${nextLevelConfig.id}`);
				// Show level up celebration
				setShowLevelUp(true);

				// Don't generate new note during level transition
				setTimeout(() => {
					setShowLevelUp(false);
					setLevel(nextLevelConfig.id);
					// Clear note AFTER level changes so new level's notes are used
					setTimeout(() => {
						setCurrentNote(null);
						setFeedback(null);
					}, 100);
				}, 2000);
			} else {
				// Normal flow - clear current note to get next one
				setTimeout(() => {
					console.log("Clearing current note to trigger new note generation");
					setCurrentNote(null); // Clear first
					setFeedback(null); // Then clear feedback
				}, 600);
			}

			onScoreUpdate(scoreRef.current, streakRef.current, level);
		} else {
			// Incorrect
			setFeedback("incorrect");
			streakRef.current = 0;
			onScoreUpdate(scoreRef.current, 0, level);

			// Play error sound
			soundEngine.playError();

			// Shake animation for wrong answer
			if (currentNoteGraphicRef.current) {
				gsap.to(currentNoteGraphicRef.current, {
					pixi: { x: currentNoteGraphicRef.current.x + 10 },
					duration: 0.05,
					yoyo: true,
					repeat: 5,
					ease: "power1.inOut",
				});
			}

			setTimeout(() => {
				setFeedback(null);
			}, 600);
		}
	};

	return (
		<div className="absolute inset-0 w-full h-full">
			<div ref={containerRef} className="absolute inset-0" />

			{/* Note selector buttons at bottom */}
			{gameState === GameState.PLAYING && (
				<div className="absolute bottom-20 left-0 right-0 flex justify-center gap-4 pointer-events-auto z-50">
					{availableNotes.map((note, index) => (
						<button
							type="button"
							key={note.name}
							onClick={() => handleNoteSelection(note.name)}
							onMouseEnter={() => soundEngine.playNote(note.displayName, "32n")}
							disabled={feedback !== null}
							className="relative group animate-fade-in"
							style={{
								opacity: feedback !== null ? 0.5 : 1,
								animationDelay: `${index * 0.1}s`,
							}}
						>
							{/* Glow on hover */}
							<div
								className="absolute inset-0 blur-xl opacity-0 group-hover:opacity-50 transition-all duration-300 rounded-full"
								style={{
									backgroundColor: `#${note.color.toString(16).padStart(6, "0")}`,
								}}
							/>

							{/* Button */}
							<div
								className="relative w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-110 group-active:scale-95 group-hover:shadow-2xl"
								style={{
									backgroundColor: `#${note.color.toString(16).padStart(6, "0")}`,
									boxShadow: `0 0 0 2px rgba(${parseInt(
										note.color.toString(16).slice(0, 2),
										16
									)}, ${parseInt(note.color.toString(16).slice(2, 4), 16)}, ${parseInt(
										note.color.toString(16).slice(4, 6),
										16
									)}, 0.3)`,
								}}
							>
								<span className="text-white text-2xl font-serif font-bold drop-shadow-lg">
									{note.name}
								</span>
							</div>

							{/* Keyboard hint */}
							<div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-gray-400 text-xs uppercase tracking-widest font-semibold">
								{note.name}
							</div>
						</button>
					))}
				</div>
			)}

			{/* Instructions */}
			{gameState === GameState.PLAYING && (
				<div className="absolute bottom-4 left-0 right-0 text-center text-gray-500 text-sm pointer-events-none">
					Click a button or press the letter key
				</div>
			)}

			{/* Level Up Celebration */}
			{showLevelUp && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 pointer-events-none animate-fade-in">
					<div className="text-center space-y-4 animate-scale-in">
						<div className="text-8xl">🎉</div>
						<h2 className="text-6xl font-serif text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
							Level Up!
						</h2>
						<p className="text-2xl text-gray-300">
							{getNextLevel(level)?.name}
						</p>
						<p className="text-sm text-gray-500 uppercase tracking-widest">
							{getNextLevel(level)?.description}
						</p>
					</div>
				</div>
			)}
		</div>
	);
};

export default NoteIdentificationGame;
