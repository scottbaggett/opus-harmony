export const COLORS = {
	background: "#0f0e11",
	surface: "#17161b",
	surfaceLight: "#232128",
	primary: "#a855f7", // Purple
	accent: "#fbbf24", // Gold
	text: "#f3f4f6",
	textMuted: "#9ca3af",
	noteColors: [
		"#8b5cf6", // Violet
		"#ec4899", // Pink
		"#f43f5e", // Rose
		"#d946ef", // Fuchsia
		"#a855f7", // Purple
	],
};

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
		color: COLORS.noteColors[i % COLORS.noteColors.length],
	})),
};
