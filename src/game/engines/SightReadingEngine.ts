import { type Application, BlurFilter, Container, Graphics, Text } from "pixi.js";
import { THEME } from "../../core/theme";
import { GameState } from "../../core/types";

// Music Theory Constants
const TREBLE_NOTES = ["E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5"];
// Visual Constants
const STAFF_LINE_SPACING = 40;
const SPEED_BASE = 8;

interface NoteObject {
	gfx: Container;
	laneIndex: number;
	hit: boolean;
	missed: boolean;
	perfect?: boolean;
}

interface ParticleObject {
	gfx: Graphics;
	vx: number;
	vy: number;
	life: number;
}

interface SightReadingEngineCallbacks {
	onScoreUpdate: (score: number, streak: number) => void;
	onGameOver: (finalScore: number) => void;
}

export class SightReadingEngine {
	private app: Application;
	private destroyed = false;
	private tickerCallback: any;

	// Layers
	private bgLayer!: Container;
	private staffLayer!: Container;
	private effectsLayer!: Container;
	private gameLayer!: Container;

	// Game Objects
	private player!: Container;
	private notes: NoteObject[] = [];
	private particles: ParticleObject[] = [];

	// Game State
	private gameState: GameState = GameState.MENU;
	private playerY = 0;
	private currentPlayerY = 0;
	private laneIndex = 4; // Start at middle (B4)
	private score = 0;
	private streak = 0;
	private nextSpawnTime = 0;
	private gameTime = 0;

	// Callbacks
	private callbacks: SightReadingEngineCallbacks;

	constructor(app: Application, callbacks: SightReadingEngineCallbacks) {
		this.app = app;
		this.callbacks = callbacks;
	}

	async init() {
		// --- LAYERS ---
		this.bgLayer = new Container();
		this.staffLayer = new Container();
		this.effectsLayer = new Container();
		this.gameLayer = new Container();

		this.app.stage.addChild(this.bgLayer);
		this.app.stage.addChild(this.staffLayer);
		this.app.stage.addChild(this.effectsLayer);
		this.app.stage.addChild(this.gameLayer);

		// --- BACKGROUND ---
		const grid = new Graphics();
		for (let x = 0; x < this.app.screen.width; x += 100) {
			grid.moveTo(x, 0);
			grid.lineTo(x, this.app.screen.height);
		}
		grid.stroke({ width: 1, color: 0xffffff, alpha: 0.03 });
		this.bgLayer.addChild(grid);

		// --- STAFF SETUP ---
		const centerY = this.app.screen.height / 2;
		const startY = centerY - 2 * STAFF_LINE_SPACING;

		// Staff Glow
		const staffGlow = new Graphics();
		staffGlow.rect(0, startY - 20, this.app.screen.width, STAFF_LINE_SPACING * 4 + 40);
		staffGlow.fill({ color: 0x000000, alpha: 0.3 });
		const blur = new BlurFilter();
		blur.strength = 10;
		staffGlow.filters = [blur];
		this.staffLayer.addChild(staffGlow);

		// Draw 5 lines
		for (let i = 0; i < 5; i++) {
			const line = new Graphics();
			line.moveTo(0, 0);
			line.lineTo(this.app.screen.width, 0);
			line.stroke({ width: 2, color: 0x666666 });
			line.y = startY + i * STAFF_LINE_SPACING;
			this.staffLayer.addChild(line);
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
		this.staffLayer.addChild(clefText);

		// --- PLAYER CURSOR ---
		this.player = new Container();

		// Glow
		const playerGlow = new Graphics();
		playerGlow.circle(0, 0, 20);
		playerGlow.fill({ color: THEME.pixi.accent, alpha: 0.4 });
		playerGlow.filters = [new BlurFilter({ strength: 8 })];
		this.player.addChild(playerGlow);

		// Core
		const playerCore = new Graphics();
		playerCore.circle(0, 0, 8);
		playerCore.fill({ color: THEME.pixi.white });
		this.player.addChild(playerCore);

		// Ring
		const playerRing = new Graphics();
		playerRing.circle(0, 0, 14);
		playerRing.stroke({ width: 2, color: THEME.pixi.accent });
		this.player.addChild(playerRing);

		this.gameLayer.addChild(this.player);

		this.player.x = 250;
		this.player.y = centerY;
		this.playerY = centerY;
		this.currentPlayerY = centerY;

		// Start ticker
		this.tickerCallback = (ticker: any) => this.gameLoop(ticker);
		this.app.ticker.add(this.tickerCallback);
	}

	setGameState(state: GameState) {
		this.gameState = state;

		// Reset score on game start
		if (state === GameState.PLAYING) {
			this.score = 0;
			this.streak = 0;
			this.laneIndex = 4;

			// Clear all notes
			this.notes.forEach((n) => {
				if (n.gfx?.destroy) n.gfx.destroy();
			});
			this.notes = [];
		}
	}

	handleKeyDown(key: string) {
		// Only allow input if playing
		if (this.gameState !== GameState.PLAYING) return;

		let newIndex = this.laneIndex;
		if (key === "ArrowUp") newIndex++;
		if (key === "ArrowDown") newIndex--;

		// Clamp to treble range
		if (newIndex >= 0 && newIndex < TREBLE_NOTES.length) {
			this.laneIndex = newIndex;

			// Calculate target Y
			const centerY = this.app.screen.height / 2;
			const indexDiff = newIndex - 4;
			const targetY = centerY - indexDiff * (STAFF_LINE_SPACING / 2);

			// INSTANT MOVEMENT - no lerp
			this.playerY = targetY;
			this.currentPlayerY = targetY;
			this.player.y = targetY;

			// AUTO-HIT: Check if any note is in range when we press the key
			for (let i = this.notes.length - 1; i >= 0; i--) {
				const noteObj = this.notes[i];
				if (noteObj.hit || noteObj.missed) continue;

				const dx = noteObj.gfx.x - this.player.x;
				const dy = noteObj.gfx.y - this.player.y;
				const dist = Math.sqrt(dx * dx + dy * dy);

				// Hit window check
				if (dist < 30 && noteObj.laneIndex === newIndex) {
					// PERFECT HIT!
					noteObj.hit = true;

					// Bonus points for manual timing (vs auto-collision)
					const isPerfectTiming = Math.abs(dx) < 15; // Very close to player X
					const points = isPerfectTiming ? 200 : 100;

					this.score += points;
					this.streak += 1;

					// Visual feedback
					const color = isPerfectTiming ? THEME.pixi.gold : THEME.pixi.accent;
					this.spawnParticles(noteObj.gfx.x, noteObj.gfx.y, color);

					// Animate
					noteObj.gfx.scale.set(1.5);
					noteObj.gfx.alpha = 0;
					noteObj.perfect = isPerfectTiming;

					this.callbacks.onScoreUpdate(this.score, this.streak);
					break; // Only hit one note per keypress
				}
			}
		}
	}

	private gameLoop(ticker: any) {
		// IDLE STATE ANIMATION
		if (this.gameState !== GameState.PLAYING) {
			if (this.gameState === GameState.MENU) {
				const t = performance.now() * 0.002;
				const centerY = this.app.screen.height / 2;
				// Gentle hovering
				this.player.y = centerY + Math.sin(t) * 10;
			}
			return;
		}

		// PLAYING STATE
		const delta = ticker.deltaTime;
		const time = performance.now();
		this.gameTime += delta;

		const centerY = this.app.screen.height / 2;

		// 1. Player Physics - NO LERP NEEDED (instant movement from input handler)
		this.player.y = this.currentPlayerY;

		// 2. Spawning Logic
		if (time > this.nextSpawnTime) {
			this.spawnNote(this.app.screen.width + 50, centerY);
			// Difficulty curve: Spawn faster as score increases
			const difficulty = Math.min(this.score / 5000, 2); // Cap difficulty
			// Base interval 2000ms, decreases with difficulty
			const interval = Math.max(600, 2000 - difficulty * 800);
			this.nextSpawnTime = time + interval;
		}

		// 3. Update Notes
		// Speed increases with score
		const currentSpeed = SPEED_BASE * (1 + this.score / 10000) * delta;

		for (let i = this.notes.length - 1; i >= 0; i--) {
			const noteObj = this.notes[i];
			noteObj.gfx.x -= currentSpeed;

			// Miss Detection (passed player without being hit)
			if (!noteObj.hit && !noteObj.missed && noteObj.gfx.x < this.player.x - 50) {
				noteObj.missed = true;
				this.streak = 0;
				this.spawnParticles(noteObj.gfx.x, noteObj.gfx.y, THEME.pixi.error);
				this.callbacks.onScoreUpdate(this.score, 0);
				this.callbacks.onGameOver(this.score);
			}

			// Cleanup Off-screen
			if (noteObj.gfx.x < -100) {
				noteObj.gfx.destroy();
				this.notes.splice(i, 1);
			}
		}

		// 4. Update Particles
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.gfx.x += p.vx * delta;
			p.gfx.y += p.vy * delta;
			p.gfx.alpha -= 0.03 * delta;
			p.gfx.rotation += 0.1 * delta;
			p.life -= delta;

			if (p.life <= 0) {
				p.gfx.destroy();
				this.particles.splice(i, 1);
			}
		}
	}

	private spawnNote(startX: number, centerY: number) {
		const randIndex = Math.floor(Math.random() * TREBLE_NOTES.length);
		const indexDiff = randIndex - 4;
		const targetY = centerY - indexDiff * (STAFF_LINE_SPACING / 2);

		const noteContainer = new Container();
		noteContainer.x = startX;
		noteContainer.y = targetY;

		// Note Head
		const head = new Graphics();
		head.ellipse(0, 0, 16, 12);
		head.fill(THEME.pixi.text);
		head.rotation = -0.3; // Italic style
		noteContainer.addChild(head);

		// Stem
		const stemDir = randIndex >= 4 ? 1 : -1;
		const stemHeight = 55;

		const stem = new Graphics();
		const stemX = stemDir === 1 ? -14 : 14;

		stem.moveTo(stemX, 0);
		stem.lineTo(stemX, stemDir * stemHeight);
		stem.stroke({ width: 2, color: THEME.pixi.text });
		noteContainer.addChild(stem);

		this.gameLayer.addChild(noteContainer);

		this.notes.push({
			gfx: noteContainer,
			laneIndex: randIndex,
			hit: false,
			missed: false,
		});
	}

	private spawnParticles(x: number, y: number, color: number) {
		const count = 8;
		for (let i = 0; i < count; i++) {
			const angle = (Math.PI * 2 * i) / count;
			const speed = 2 + Math.random() * 2;

			const particle = new Graphics();
			particle.rect(0, 0, 4, 4);
			particle.fill(color);
			particle.x = x;
			particle.y = y;

			this.effectsLayer.addChild(particle);

			this.particles.push({
				gfx: particle,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: 30 + Math.random() * 20,
			});
		}
	}

	cleanup() {
		if (this.destroyed) return;
		this.destroyed = true;

		// Remove ticker
		if (this.tickerCallback && this.app?.ticker) {
			this.app.ticker.remove(this.tickerCallback);
		}

		// Clear all game objects
		this.notes.forEach((n) => n.gfx?.destroy());
		this.particles.forEach((p) => p.gfx?.destroy());
		this.notes = [];
		this.particles = [];
	}
}
