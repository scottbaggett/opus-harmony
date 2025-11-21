import * as Tone from "tone";

class SoundEngine {
	private synth: Tone.PolySynth | null = null;
	private piano: Tone.Sampler | null = null;
	private initialized = false;

	async init() {
		if (this.initialized) return;

		// Initialize Tone.js audio context
		await Tone.start();
		console.log("Audio context started");

		// Create a warm, piano-like synthesizer
		this.synth = new Tone.PolySynth(Tone.Synth, {
			oscillator: {
				type: "sine",
			},
			envelope: {
				attack: 0.005,
				decay: 0.1,
				sustain: 0.3,
				release: 1.2,
			},
		}).toDestination();

		// Set volume
		this.synth.volume.value = -8;

		this.initialized = true;
	}

	// Play a musical note (e.g., "C4", "E5", "G#4")
	playNote(note: string, duration: string = "8n") {
		if (!this.synth) {
			console.warn("Sound engine not initialized");
			return;
		}

		this.synth.triggerAttackRelease(note, duration);
	}

	// Play success sound (major 7th chord based on root note)
	playSuccess(rootNote: string = "C4") {
		if (!this.synth) return;

		// Parse the root note to get note name and octave
		const noteName = rootNote.slice(0, -1); // e.g., "C", "E", "G#"
		const octave = parseInt(rootNote.slice(-1), 10); // e.g., 4, 5

		// Build major 7th chord: root, major 3rd, perfect 5th, major 7th
		const chord = this.buildMajor7Chord(noteName, octave);

		// Play as ascending arpeggio
		const now = Tone.now();
		chord.forEach((note, i) => {
			this.synth?.triggerAttackRelease(note, "16n", now + i * 0.08);
		});
	}

	// Build a major 7th chord from a root note
	private buildMajor7Chord(rootNote: string, octave: number): string[] {
		// Chromatic scale for interval calculation
		const chromaticScale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

		// Find root position in chromatic scale
		const rootIndex = chromaticScale.indexOf(rootNote);
		if (rootIndex === -1) {
			console.warn(`Invalid note: ${rootNote}`);
			return [`${rootNote}${octave}`];
		}

		// Major 7th intervals: root (0), major 3rd (+4), perfect 5th (+7), major 7th (+11)
		const intervals = [0, 4, 7, 11];

		return intervals.map((interval) => {
			const noteIndex = (rootIndex + interval) % 12;
			const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
			return `${chromaticScale[noteIndex]}${noteOctave}`;
		});
	}

	// Play error sound (descending minor chord)
	playError() {
		if (!this.synth) return;

		const now = Tone.now();
		this.synth.triggerAttackRelease(["D4", "F4", "A4"], "16n", now);
	}

	// Play a chord
	playChord(notes: string[], duration: string = "4n") {
		if (!this.synth) return;

		this.synth.triggerAttackRelease(notes, duration);
	}

	// Clean up
	dispose() {
		this.synth?.dispose();
		this.piano?.dispose();
		this.initialized = false;
	}
}

// Export singleton instance
export const soundEngine = new SoundEngine();
