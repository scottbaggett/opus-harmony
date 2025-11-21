import { create } from "zustand";
import { GameState } from "../../core/types";

interface GameStoreState {
	// Game State
	gameState: GameState;
	currentLevel: number;
	score: number;
	streak: number;
	highScore: number;
	isPlaying: boolean;

	// Actions
	setGameState: (state: GameState) => void;
	setScore: (score: number) => void;
	increaseScore: (amount: number) => void;
	setStreak: (streak: number) => void;
	increaseStreak: () => void;
	resetStreak: () => void;
	setLevel: (level: number) => void;
	updateHighScore: (score: number) => void;
	reset: () => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
	// Initial State
	gameState: GameState.MENU,
	currentLevel: 1,
	score: 0,
	streak: 0,
	highScore: 0,
	isPlaying: false,

	// Actions
	setGameState: (gameState) => set({ gameState, isPlaying: gameState === GameState.PLAYING }),

	setScore: (score) => set({ score }),

	increaseScore: (amount) =>
		set((state) => ({
			score: state.score + amount,
		})),

	setStreak: (streak) => set({ streak }),

	increaseStreak: () =>
		set((state) => ({
			streak: state.streak + 1,
		})),

	resetStreak: () => set({ streak: 0 }),

	setLevel: (currentLevel) => set({ currentLevel }),

	updateHighScore: (score) =>
		set((state) => ({
			highScore: Math.max(state.highScore, score),
		})),

	reset: () =>
		set({
			score: 0,
			streak: 0,
			currentLevel: 1,
			isPlaying: false,
		}),
}));
