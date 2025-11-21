import { Application, BlurFilter, Container, Graphics, Text } from "pixi.js";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { COLORS } from "../constants";
import { GameState } from "../types";

interface SightReadingGameProps {
	gameState: GameState;
	onScoreUpdate: (score: number, streak: number) => void;
	onGameOver: (finalScore: number) => void;
}

// Music Theory Constants
const TREBLE_NOTES = ["E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5"];
// Visual Constants
const STAFF_LINE_SPACING = 40;
const SPEED_BASE = 8;

const SightReadingGame: React.FC<SightReadingGameProps> = ({
	gameState,
	onScoreUpdate,
	onGameOver,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const appRef = useRef<Application | null>(null);
	const [isReady, setIsReady] = useState(false);

	// Game Logic Refs
	const playerYRef = useRef<number>(0);
	const currentPlayerYRef = useRef<number>(0);
	const laneIndexRef = useRef<number>(4);

	const notesRef = useRef<any[]>([]);
	const particlesRef = useRef<any[]>([]);
	const scoreRef = useRef(0);
	const streakRef = useRef(0);
	const nextSpawnTimeRef = useRef(0);
	const gameTimeRef = useRef(0);

	// Sync gameState to a ref so the ticker can access the latest value without needing to be removed/re-added constantly
	const gameStateRef = useRef(gameState);
	useEffect(() => {
		gameStateRef.current = gameState;

		// Reset score on game start
		if (gameState === GameState.PLAYING) {
			scoreRef.current = 0;
			streakRef.current = 0;
			laneIndexRef.current = 4;
			notesRef.current.forEach((n) => {
				if (n.gfx?.destroy) n.gfx.destroy();
			});
			notesRef.current = [];
		}
	}, [gameState]);

	useEffect(() => {
		let app: Application | null = null;
		let destroyed = false;

		const initPixi = async () => {
			// Create App
			app = new Application();

			await app.init({
				resizeTo: window,
				antialias: true,
				backgroundAlpha: 0,
				resolution: window.devicePixelRatio || 1,
				autoDensity: true,
			});

			// Handle race condition if component unmounted during await
			if (destroyed) {
				await app.destroy({ removeView: true });
				return;
			}

			if (containerRef.current) {
				containerRef.current.appendChild(app.canvas);
			}
			appRef.current = app;

			// --- LAYERS ---
			const bgLayer = new Container();
			const staffLayer = new Container();
			const effectsLayer = new Container();
			const gameLayer = new Container();

			app.stage.addChild(bgLayer);
			app.stage.addChild(staffLayer);
			app.stage.addChild(effectsLayer);
			app.stage.addChild(gameLayer);

			// --- BACKGROUND ---
			// We rely on CSS for the main background color, but add a subtle interactive grid here
			const grid = new Graphics();
			for (let x = 0; x < app.screen.width; x += 100) {
				grid.moveTo(x, 0);
				grid.lineTo(x, app.screen.height);
			}
			grid.stroke({ width: 1, color: 0xffffff, alpha: 0.03 });
			bgLayer.addChild(grid);

			// --- STAFF SETUP ---
			const centerY = app.screen.height / 2;
			const startY = centerY - 2 * STAFF_LINE_SPACING;

			// Staff Glow
			const staffGlow = new Graphics();
			staffGlow.rect(0, startY - 20, app.screen.width, STAFF_LINE_SPACING * 4 + 40);
			staffGlow.fill({ color: 0x000000, alpha: 0.3 });
			const blur = new BlurFilter();
			blur.strength = 10;
			staffGlow.filters = [blur];
			staffLayer.addChild(staffGlow);

			// Draw 5 lines
			for (let i = 0; i < 5; i++) {
				const line = new Graphics();
				line.moveTo(0, 0);
				line.lineTo(app.screen.width, 0);
				line.stroke({ width: 2, color: 0x666666 });
				line.y = startY + i * STAFF_LINE_SPACING;
				staffLayer.addChild(line);
			}

			// Clef
			const clefText = new Text({
				text: "𝄞",
				style: {
					fontFamily: "EB Garamond",
					fontSize: 180,
					fill: 0xe5e5e5,
					dropShadow: { alpha: 0.5, blur: 10, distance: 0, color: 0x000000 },
				},
			});
			clefText.x = 40;
			clefText.y = startY - 60;
			staffLayer.addChild(clefText);

			// --- PLAYER CURSOR ---
			const player = new Container();

			// Glow
			const playerGlow = new Graphics();
			playerGlow.circle(0, 0, 20);
			playerGlow.fill({ color: COLORS.accent, alpha: 0.4 });
			playerGlow.filters = [new BlurFilter({ strength: 8 })];
			player.addChild(playerGlow);

			// Core
			const playerCore = new Graphics();
			playerCore.circle(0, 0, 8);
			playerCore.fill({ color: 0xffffff });
			player.addChild(playerCore);

			// Ring
			const playerRing = new Graphics();
			playerRing.circle(0, 0, 14);
			playerRing.stroke({ width: 2, color: COLORS.accent });
			player.addChild(playerRing);

			gameLayer.addChild(player);

			player.x = 250;
			player.y = centerY;
			playerYRef.current = centerY;
			currentPlayerYRef.current = centerY;

			// Mark as ready to start loop
			setIsReady(true);
		};

		initPixi();

		return () => {
			destroyed = true;
			setIsReady(false);
			// Cleanup Pixi
			if (appRef.current) {
				appRef.current.destroy({ removeView: true });
				appRef.current = null;
			}
		};
	}, []);

	// --- INPUT HANDLER ---
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Only allow input if playing
			if (gameStateRef.current !== GameState.PLAYING) return;

			const app = appRef.current;
			if (!app) return;

			let newIndex = laneIndexRef.current;
			if (e.key === "ArrowUp") newIndex++;
			if (e.key === "ArrowDown") newIndex--;

			// Clamp to treble range
			if (newIndex >= 0 && newIndex < TREBLE_NOTES.length) {
				laneIndexRef.current = newIndex;
				// Calculate target Y
				// Center line is index 4 (B4).
				const centerY = app.screen.height / 2;
				const indexDiff = newIndex - 4;
				const targetY = centerY - indexDiff * (STAFF_LINE_SPACING / 2);

				// INSTANT MOVEMENT - no lerp
				playerYRef.current = targetY;
				currentPlayerYRef.current = targetY;

				// AUTO-HIT: Check if any note is in range when we press the key
				const player = app.stage.children[3]?.children[0];
				if (!player) return;

				player.y = targetY; // Update player position immediately

				// Check all notes for hits
				for (let i = notesRef.current.length - 1; i >= 0; i--) {
					const noteObj = notesRef.current[i];
					if (noteObj.hit || noteObj.missed) continue;

					const dx = noteObj.gfx.x - player.x;
					const dy = noteObj.gfx.y - player.y;
					const dist = Math.sqrt(dx * dx + dy * dy);

					// Hit window check
					if (dist < 30 && noteObj.laneIndex === newIndex) {
						// PERFECT HIT!
						noteObj.hit = true;

						// Bonus points for manual timing (vs auto-collision)
						const isPerfectTiming = Math.abs(dx) < 15; // Very close to player X
						const points = isPerfectTiming ? 200 : 100;

						scoreRef.current += points;
						streakRef.current += 1;

						// Visual feedback
						const effectsLayer = app.stage.children[2];
						const color = isPerfectTiming ? 0xffd700 : COLORS.accent; // Gold for perfect
						spawnParticles(noteObj.gfx.x, noteObj.gfx.y, color, effectsLayer);

						// Animate
						noteObj.gfx.scale.set(1.5);
						noteObj.gfx.alpha = 0;
						noteObj.perfect = isPerfectTiming;

						onScoreUpdate(scoreRef.current, streakRef.current);
						break; // Only hit one note per keypress
					}
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [, spawnParticles, onScoreUpdate]); // No deps needed as we use refs

	// --- GAME LOOP ---
	useEffect(() => {
		if (!isReady || !appRef.current) return;

		const app = appRef.current;

		const tickerCb = (ticker: any) => {
			// IDLE STATE ANIMATION
			if (gameStateRef.current !== GameState.PLAYING) {
				if (gameStateRef.current === GameState.MENU) {
					const t = performance.now() * 0.002;
					const centerY = app.screen.height / 2;
					// Gentle hovering
					const player = app.stage.children[3]?.children[0];
					if (player) {
						player.y = centerY + Math.sin(t) * 10;
					}
				}
				return;
			}

			// PLAYING STATE
			const delta = ticker.deltaTime;
			const time = performance.now();
			gameTimeRef.current += delta;

			const centerY = app.screen.height / 2;
			const effectsLayer = app.stage.children[2] as Container;
			const gameLayer = app.stage.children[3] as Container;
			const player = gameLayer.children[0]; // Player is first child

			if (!player) return;

			// 1. Player Physics - NO LERP NEEDED (instant movement from input handler)
			player.y = currentPlayerYRef.current;

			// 2. Spawning Logic
			if (time > nextSpawnTimeRef.current) {
				spawnNote(app.screen.width + 50, centerY, gameLayer);
				// Difficulty curve: Spawn faster as score increases
				const difficulty = Math.min(scoreRef.current / 5000, 2); // Cap difficulty
				// Base interval 2000ms, decreases with difficulty
				const interval = Math.max(600, 2000 - difficulty * 800);
				nextSpawnTimeRef.current = time + interval;
			}

			// 3. Update Notes
			// Speed increases with score
			const currentSpeed = SPEED_BASE * (1 + scoreRef.current / 10000) * delta;

			for (let i = notesRef.current.length - 1; i >= 0; i--) {
				const noteObj = notesRef.current[i];
				noteObj.gfx.x -= currentSpeed;

				// Miss Detection (passed player without being hit)
				if (!noteObj.hit && !noteObj.missed && noteObj.gfx.x < player.x - 50) {
					noteObj.missed = true;
					streakRef.current = 0;
					spawnParticles(noteObj.gfx.x, noteObj.gfx.y, 0xef4444, effectsLayer);
					onScoreUpdate(scoreRef.current, 0);
					onGameOver(scoreRef.current);
				}

				// Cleanup Off-screen
				if (noteObj.gfx.x < -100) {
					noteObj.gfx.destroy();
					notesRef.current.splice(i, 1);
				}
			}

			// 4. Update Particles
			for (let i = particlesRef.current.length - 1; i >= 0; i--) {
				const p = particlesRef.current[i];
				p.gfx.x += p.vx * delta;
				p.gfx.y += p.vy * delta;
				p.gfx.alpha -= 0.03 * delta;
				p.gfx.rotation += 0.1 * delta;
				p.life -= delta;

				if (p.life <= 0) {
					p.gfx.destroy();
					particlesRef.current.splice(i, 1);
				}
			}
		};

		app.ticker.add(tickerCb);

		return () => {
			if (app?.ticker) {
				app.ticker.remove(tickerCb);
			}
		};
	}, [isReady, spawnParticles, onScoreUpdate, spawnNote, onGameOver]);

	// --- HELPERS ---

	const spawnNote = (startX: number, centerY: number, layer: Container) => {
		const randIndex = Math.floor(Math.random() * TREBLE_NOTES.length);
		const indexDiff = randIndex - 4;
		const targetY = centerY - indexDiff * (STAFF_LINE_SPACING / 2);

		const noteContainer = new Container();
		noteContainer.x = startX;
		noteContainer.y = targetY;

		// Note Head
		const head = new Graphics();
		head.ellipse(0, 0, 16, 12);
		head.fill(COLORS.text);
		head.rotation = -0.3; // Italic style
		noteContainer.addChild(head);

		// Stem
		// Notes above middle line (index 4) stem down, below stem up
		const stemDir = randIndex >= 4 ? 1 : -1;
		const stemHeight = 55;

		const stem = new Graphics();
		// If stem down, start from left side of notehead. If up, start from right.
		const stemX = stemDir === 1 ? -14 : 14;

		stem.moveTo(stemX, 0);
		stem.lineTo(stemX, stemDir * stemHeight);
		stem.stroke({ width: 2, color: COLORS.text });
		noteContainer.addChild(stem);

		// Ledger Lines
		// C5 is index 5 (one above center). Center is B4 (index 4).
		// Treble Clef: E4 (bottom line) is index 0. F5 (top line) is index 8.
		// Wait, E4 is bottom line?
		// Standard Treble: E4, G4, B4, D5, F5 are lines.
		// Indices in TREBLE_NOTES:
		// 0: E4 (Line)
		// 1: F4 (Space)
		// 2: G4 (Line)
		// 3: A4 (Space)
		// 4: B4 (Line - Middle)
		// 5: C5 (Space)
		// 6: D5 (Line)
		// 7: E5 (Space)
		// 8: F5 (Line)

		// If we go below E4 (C4 is middle C), we need ledger lines.
		// For now we stuck to Staff range.

		layer.addChild(noteContainer);

		notesRef.current.push({
			gfx: noteContainer,
			laneIndex: randIndex,
			hit: false,
			missed: false,
		});
	};

	const spawnParticles = (x: number, y: number, color: any, layer: Container) => {
		for (let i = 0; i < 12; i++) {
			const p = new Graphics();
			p.circle(0, 0, 3);
			p.fill(color);
			p.x = x;
			p.y = y;

			const angle = Math.random() * Math.PI * 2;
			const speed = 2 + Math.random() * 4;

			layer.addChild(p);
			particlesRef.current.push({
				gfx: p,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: 40 + Math.random() * 20,
			});
		}
	};

	return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
};

export default SightReadingGame;
