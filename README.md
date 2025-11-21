# Opus One

A modern music theory learning application that combines interactive gameplay with AI-powered coaching to help you master sight reading and note identification.

## Features

- **Note Identification Game**: Progressive level system to learn treble clef note reading through spaced repetition
- **Sight Reading Game**: Rhythm-based note matching game with scrolling notes
- **AI-Powered Feedback**: Personalized music theory coaching powered by Google Gemini AI
- **High-Performance Graphics**: Smooth animations powered by PixiJS and GSAP
- **Interactive Audio**: Real-time audio synthesis with Tone.js

## Tech Stack

- **TanStack Start** - Full-stack React framework with file-based routing
- **React 19** with TypeScript
- **PixiJS** - High-performance 2D graphics rendering
- **Tone.js** - Audio synthesis and music playback
- **GSAP** - Animation engine
- **Google Gemini AI** - Personalized feedback and coaching
- **Zustand** - State management
- **Vite 7** - Build tool and dev server

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- pnpm package manager

### Installation

```bash
# Install dependencies
pnpm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

### Development

```bash
# Start development server (runs on port 3000)
pnpm run dev

# Type check
pnpm run typecheck

# Lint code
pnpm run lint

# Format code
pnpm run format
```

Visit `http://localhost:3000` to see the application.

### Production

```bash
# Build for production
pnpm run build

# Preview production build
pnpm run start
```

## Architecture

Opus One follows a **dual-world architecture** pattern:

- **React World**: Handles UI, menus, and high-level state
- **Game World** (PixiJS/GSAP/Tone): Handles animation, collision detection, and audio

Game logic is separated into pure TypeScript engine classes in `src/game/engines/`, while React components serve as thin wrappers that mount and manage these engines.

### Project Structure

```
src/
├── components/       # React UI components
├── core/            # Shared types, constants, configuration
├── game/            # Game logic (engines, state)
├── routes/          # TanStack Router file-based routes
│   └── api/         # Server-side API routes
└── services/        # Client-side services
```

## Contributing

This project uses:

- **Biome** for code formatting and linting
- **Tab indentation** (width 2)
- **Double quotes** for strings
- **Functional components** with React hooks

## License

MIT
