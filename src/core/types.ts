export enum ViewMode {
	GAME = "GAME",
	MENU = "MENU",
	SIGHT_READING = "SIGHT_READING",
	HARMONY = "HARMONY",
	RHYTHM = "RHYTHM",
	INTERVALS = "INTERVALS",
}

export enum GameState {
	MENU = "MENU",
	PLAYING = "PLAYING",
	GAME_OVER = "GAME_OVER",
}

export interface Note {
	id: string;
	pitch: string; // e.g., 'C4', 'D#4'
	y: number; // Y position on canvas
	laneIndex: number; // 0-8 (lines and spaces)
	duration: number;
	startTime: number;
	active: boolean;
	clef: "treble" | "bass";
	lane: number;
	color: string;
}

export interface TheoryResponse {
	explanation: string;
	example?: string;
	tip?: string;
}

export interface PlayerStats {
	score: number;
	streak: number;
	highScore: number;
}
