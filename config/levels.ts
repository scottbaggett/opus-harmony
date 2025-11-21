export interface LevelConfig {
	id: number;
	name: string;
	description: string;
	availableNotes: number[]; // Indices into TREBLE_NOTES array
	requiredScore: number; // Score needed to advance
	timeLimit?: number; // Optional time limit in seconds
	showTimer?: boolean;
}

export const LEVELS: LevelConfig[] = [
	{
		id: 1,
		name: "The Lines",
		description: "Master the 3 lines of the treble clef",
		availableNotes: [0, 2, 4], // E, G, B
		requiredScore: 50, // 5 correct answers
	},
	{
		id: 2,
		name: "The Spaces",
		description: "Learn the 4 spaces between the lines",
		availableNotes: [1, 3, 5], // F, A, C (skip D for now)
		requiredScore: 100, // 10 correct answers total
	},
	{
		id: 3,
		name: "Lines & Spaces",
		description: "Combine everything you've learned",
		availableNotes: [0, 1, 2, 3, 4, 5], // E, F, G, A, B, C
		requiredScore: 200, // 20 correct total
	},
	{
		id: 4,
		name: "Full Staff",
		description: "Complete treble clef mastery",
		availableNotes: [0, 1, 2, 3, 4, 5, 6], // All 7 notes
		requiredScore: 300,
	},
	{
		id: 5,
		name: "Speed Reading",
		description: "Can you keep up the pace?",
		availableNotes: [0, 1, 2, 3, 4, 5, 6],
		requiredScore: 400,
		showTimer: true,
	},
	{
		id: 6,
		name: "Master Class",
		description: "The ultimate challenge",
		availableNotes: [0, 1, 2, 3, 4, 5, 6],
		requiredScore: 500,
		showTimer: true,
		timeLimit: 60, // 60 seconds time pressure
	},
];

export const getNextLevel = (currentLevel: number): LevelConfig | null => {
	const nextLevelConfig = LEVELS.find((l) => l.id === currentLevel + 1);
	return nextLevelConfig || null;
};

export const getCurrentLevelConfig = (level: number): LevelConfig => {
	return LEVELS.find((l) => l.id === level) || LEVELS[0];
};
