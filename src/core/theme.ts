/**
 * Theme Configuration
 *
 * Central theme file for colors and visual constants.
 * Provides both CSS hex strings and PixiJS numeric color values.
 */

// Helper to convert hex string to PixiJS number
export const hexToPixi = (hex: string): number => {
	return parseInt(hex.replace("#", ""), 16);
};

export const THEME = {
	colors: {
		// Background & Surfaces
		background: "#0f0e11",
		surface: "#17161b",
		surfaceLight: "#232128",

		// Brand Colors
		primary: "#a855f7", // Purple
		accent: "#fbbf24", // Gold

		// Text
		text: "#f3f4f6",
		textMuted: "#9ca3af",

		// Semantic Colors
		success: "#10b981",
		error: "#ef4444",
		warning: "#f59e0b",

		// Note Colors (for visual variety)
		noteColors: [
			"#8b5cf6", // Violet
			"#ec4899", // Pink
			"#f43f5e", // Rose
			"#d946ef", // Fuchsia
			"#a855f7", // Purple
		],
	},

	// PixiJS-compatible numeric colors
	pixi: {
		background: 0x0f0e11,
		surface: 0x17161b,
		surfaceLight: 0x232128,
		primary: 0xa855f7,
		accent: 0xfbbf24,
		text: 0xf3f4f6,
		textMuted: 0x9ca3af,
		success: 0x10b981,
		error: 0xef4444,
		warning: 0xf59e0b,
		white: 0xffffff,
		black: 0x000000,
		gold: 0xffd700, // For perfect hits
	},

	// Visual Constants
	staff: {
		lineSpacing: 40,
		lineWidth: 2,
		lineColor: 0x666666,
	},

	typography: {
		fontFamily: "EB Garamond, serif",
		sizes: {
			clef: 180,
			title: 96,
			heading: 48,
			body: 16,
			small: 12,
		},
	},
} as const;

// Legacy export for backwards compatibility
export const COLORS = THEME.colors;
