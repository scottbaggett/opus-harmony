# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Opus One is a music theory learning application built with React, TypeScript, PixiJS, and Tone.js. The project uses Google's Gemini AI to provide personalized music theory feedback and coaching.

## Development Commands

### Build and Development
- `pnpm run dev` - Start TanStack Start dev server (runs on port 3000)
- `pnpm run build` - Build for production
- `pnpm run start` - Preview production build

### Code Quality
- `pnpm run format` - Format code with Biome
- `pnpm run lint` - Lint code with Biome
- `pnpm run typecheck` - Type check without emitting files

## Architecture

### Tech Stack
- **TanStack Start** - Full-stack React framework with file-based routing and API routes
- **Vite 7** - Fast build tool and dev server
- **React 19** with TypeScript for UI components
- **TanStack Router** - Type-safe file-based routing
- **PixiJS** for high-performance 2D graphics rendering (staff notation, note animations)
- **Tone.js** for audio synthesis and music playback
- **GSAP** with PixiPlugin for animations
- **Google Gemini AI** for personalized music theory feedback (server-side)
- **Zustand** for global state management

### The "Two Worlds" Architecture

This project follows a **dual-world** architecture pattern to optimize performance:

1. **The React World**: Handles HUD, menus, level selection, and high-level state (Score, Game Over, Paused). Updates slowly (human reaction time).

2. **The Game World** (PixiJS/GSAP/Tone): Handles note movement, collision detection, and audio scheduling. Updates fast (60fps / 16ms).

**Critical Rule**: React does NOT drive the animation frame. Game engines handle their own loops using PixiJS `ticker`, and React components simply mount the view and subscribe to updates.

### Code Structure

```
src/
├── components/       # React UI Components (Menus, HUD, wrappers for game engines)
├── core/            # Shared types, constants, and configuration
│   ├── theme.ts     # Centralized theme (CSS + PixiJS colors)
│   ├── constants.ts
│   ├── types.ts
│   └── config/      # Level definitions, game configuration
├── game/            # Game Logic (Pure TypeScript, no React)
│   ├── engines/     # Game engines (e.g., SightReadingEngine.ts - Pixi logic)
│   └── store/       # Zustand store for global state
├── routes/          # TanStack Router file-based routes
│   ├── __root.tsx   # Root route layout
│   ├── index.tsx    # Home page route
│   └── api/         # Server-side API routes
│       └── maestro-advice.ts  # Gemini AI endpoint
├── services/        # Client-side services (calls backend APIs)
├── entry-client.tsx # Client entry point (hydration)
└── entry-server.tsx # Server entry point (SSR)
```

#### Game State Management
- **Zustand Store** (`src/game/store/gameStore.ts`): Global state for score, streak, level, gameState
  - Allows transient updates that don't trigger re-renders
  - Works outside React components (can be called from vanilla game engines)
- **Game Engines**: Pure TypeScript classes that manage PixiJS game loops
  - Example: `SightReadingEngine` handles all game logic, collision detection, spawning
  - React components mount these engines and subscribe to callbacks
- **Refs for Performance**: Game engines use class properties instead of React state for values that update in animation loops

#### Game Modes
1. **Note Identification Game** (`src/components/NoteIdentificationGame.tsx`):
   - Progressive level system defined in `src/core/config/levels.ts`
   - Teaches treble clef note reading through spaced repetition
   - PixiJS renders interactive staff with note graphics

2. **Sight Reading Game** (`src/components/SightReadingGame.tsx`):
   - Rhythm-based note matching game
   - Notes scroll from right to left
   - Player moves vertically to intercept notes
   - Uses `SightReadingEngine` class for game logic separation

#### API Routes (Server-Side)
- **`src/routes/api/maestro-advice.ts`**: POST endpoint for Gemini AI
  - Keeps API keys secure on the server
  - Handles Gemini API calls with structured output
  - Returns personalized music theory feedback

#### Services (Client-Side)
- **`src/services/soundEngine.ts`**: Tone.js wrapper (singleton with explicit `init()`)
  - Must be initialized on user interaction (browser requirement)
  - Plays notes, chords, and feedback sounds
- **`src/services/geminiService.ts`**: Client service that calls backend API routes
  - Calls `/api/maestro-advice` POST endpoint
  - Handles errors gracefully with fallback responses

#### Configuration
- **`src/core/theme.ts`**: Centralized theme with both CSS hex values and PixiJS numeric colors
  - `THEME.colors.*` for React/CSS components
  - `THEME.pixi.*` for PixiJS graphics (pre-converted hex to number)
- **`src/core/config/levels.ts`**: Progressive difficulty levels with available notes and score requirements
- **`src/core/constants.ts`**: Re-exports theme and other shared constants
- **`src/core/types.ts`**: TypeScript interfaces and enums for game state

### Environment Variables
- `GEMINI_API_KEY` in `.env` file (server-side only, required for AI features)
- TanStack Start automatically handles environment variables
- Client-side code NEVER has access to API keys (calls backend routes instead)

### Code Style (Biome Configuration)
- **Formatter**: Tab indentation (width 2), 100 character line width
- **JavaScript**: Double quotes, semicolons, ES5 trailing commas
- **Organize imports**: Enabled on save
- Follow existing patterns: use functional components with hooks, prefer `const` arrow functions

### Key Patterns

1. **Game Engine Pattern**:
   - Create vanilla TypeScript classes in `src/game/engines/` for game logic
   - Engines receive PixiJS `Application` instance and callbacks in constructor
   - Handle their own `ticker` loop, input, collision detection
   - React components are thin wrappers that mount/unmount engines

2. **State Management**:
   - Use Zustand for global state (score, level, gameState)
   - Use class properties in game engines for high-frequency updates (positions, velocities)
   - Only call Zustand actions when React needs to re-render (score changes, game over)

3. **PixiJS Integration**:
   - Initialize PixiJS applications in React `useEffect`
   - Clean up on unmount (handle async race conditions)
   - Use PixiJS `ticker` for game loops, never `requestAnimationFrame`

4. **Audio**:
   - `soundEngine.init()` must be called on user interaction (browser requirement)
   - Singleton pattern is safe since init is explicit

5. **AI Integration**:
   - Gemini responses are sanitized to strip markdown code blocks
   - Use structured output with JSON schema for type-safe responses

### Testing Locally
1. Set `GEMINI_API_KEY` in `.env` file
2. Run `pnpm install` to install dependencies (this project uses pnpm)
3. Run `pnpm run dev` to start development server
4. Visit `http://localhost:3000`

### Common Gotchas
- PixiJS `Application.init()` is async - handle race conditions on unmount
- Tone.js requires user interaction before audio context starts
- Don't put game loop logic in React components - use game engine classes
- Path alias `@/*` now resolves to `/src` directory
- High-frequency updates (every frame) should NOT trigger React re-renders - use class properties or Zustand transient updates
