// Re-export theme for backwards compatibility
export { COLORS, THEME } from "./theme";
import { THEME } from "./theme";

// Simulated initial level data for the Rhythm Game
export const INITIAL_RHYTHM_LEVEL: any = {
	bpm: 90,
	timeSignature: [4, 4],
	notes: Array.from({ length: 32 }).map((_, i) => ({
		id: `n-${i}`,
		pitch: "C4",
		duration: 1,
		startTime: i * 0.5,
		lane: Math.floor(Math.random() * 3) + 1, // Lanes 1-3
		type: "melody",
		color: THEME.colors.noteColors[i % THEME.colors.noteColors.length],
	})),
};
