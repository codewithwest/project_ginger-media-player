# Ginger Media Player

A modern, secure, cross-platform media player built with Electron, React, TypeScript, and Three.js.

## Features

- 🎵 **Media Playback** - Audio & video playback with comprehensive format support
- 🎨 **Modern UI** - Beautiful interface with TailwindCSS and Three.js visualizations
- 🔒 **Security First** - Sandboxed renderer, context isolation, type-safe IPC
- 🎯 **Background Playback** - Continues playing when window is closed
- ⌨️ **Media Keys** - System-wide media key support
- 🎛️ **CLI Ready** - Headless operation and AI integration support
- 📱 **System Tray** - Control playback from system tray

## Tech Stack

- **Electron** - Cross-platform desktop framework
- **React 18+** - UI framework with TypeScript
- **TailwindCSS v4** - Utility-first CSS framework
- **Three.js** - 3D graphics and visualizations
- **Zustand** - Lightweight state management
- **Vitest** - Fast unit testing framework

## Project Structure

```
src/
├── main/           # Main process (Node.js)
├── preload/        # Preload scripts (contextBridge)
├── renderer/       # Renderer process (React)
├── shared/         # Shared types and utilities
└── types/          # Global type definitions
```

## Development

### Prerequisites

- Node.js 18+ 
- npm 10+

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run package

# Create installers
npm run make
```

### Architecture

See [docs/architecture/OVERVIEW.md](docs/architecture/OVERVIEW.md) for detailed architecture documentation.

## Security

This application follows Electron security best practices:

- ✅ `nodeIntegration: false`
- ✅ `contextIsolation: true`
- ✅ `sandbox: true`
- ✅ Type-safe IPC communication
- ✅ Content Security Policy
- ✅ No remote module

## Phase 1 - MVP Status

✅ **Complete and Verified**

- Secure Electron configuration
- React UI with TailwindCSS v4
- Three.js animated background
- Type-safe IPC contracts
- Background playback architecture
- Media key handlers
- File dialog integration

## Roadmap

- **Phase 1** ✅ - MVP Foundation (Complete)
- **Phase 2** ⏳ - Media Engine (libVLC integration)
- **Phase 3** ⏳ - Conversion & Downloads
- **Phase 4** ⏳ - Streaming & Advanced Features
- **Phase 5** ⏳ - CLI & Production Polish

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.
