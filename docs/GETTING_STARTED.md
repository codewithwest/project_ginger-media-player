# Getting Started with Ginger Media Player

Welcome to the **Ginger Media Player** project! This guide covers the architecture, features, and development workflow for the application.

## 🏗 Architecture Overview

Ginger Media Player is built on a modern robust stack:

- **Electron**: Provides the cross-platform desktop runtime.
  - **Main Process**: Handles OS integration, native menus, window management, and backend services.
  - **Renderer Process**: Runs the React application UI.
  - **Preload Scripts**: Securely bridges the Main and Renderer processes via context isolation.

- **Frontend (Renderer)**:
  - **React 18**: Component-based UI.
  - **TypeScript**: Type safety across the codebase.
  - **Zustand**: Lightweight global state management (Media Player, Library stores).
  - **TailwindCSS**: Utility-first styling.
  - **React-Window**: Virtualization for high-performance lists and grids.

- **Backend (Main)**:
  - **Express Server**: Runs internally to serve local media files with Range support (streaming).
  - **Fluent-FFmpeg**: Wrapper for FFmpeg to handle conversions and metadata.
  - **SQLite** (Planned): For structured data persistence.
  - **File System**: JSON-based persistence for playlists and settings.

---

## 🚀 Key Features

### 1. Robust Media Engine
The core of the player. It supports a wide range of formats:
- **Direct Playback**: MP4, WebM, OGG, MP3, WAV, FLAC.
- **Transcoding**: AVI, MKV, and others are transcoded on-the-fly using FFmpeg to an HTML5-compatible stream.
- **Visuals**: A mesmerizing 3D background using `three.js` (React Three Fiber) reacts to audio frequency data.

### 2. Media Library
Efficiently manages large collections of media.
- **Scanning**: Recursively scans added folders.
- **Virtualization**: Uses `FixedSizeGrid` to render thousands of media cards without lag.
- **Persistence**: Library state is saved to `library.json` in the user data directory.

### 3. Smart Playlist
- **Queue Management**: Add, remove, and reorder tracks.
- **Persistence**: The playlist is automatically saved to `playlist.json` on every change and restored on launch.
- **Controls**: Shuffle, Repeat One, Repeat All.

### 4. Background Job System
Handles long-running tasks without blocking the UI.
- **Downloads**: Download media from URLs (via `youtube-dl` integration).
- **Conversions**: Convert media files to different formats in the background.
- **Status Tracking**: Real-time progress updates pushed to the UI.

### 5. Auto-Updater
- **Integration**: Checks GitHub Releases for new versions.
- **UX**: Notifies the user of updates and facilitates one-click download and restart.

---

## 🛠 Development Workflow

### Prerequisites
- Node.js (v18+)
- NPM or Yarn
- FFmpeg (System installed or via static binaries)

### Setup
```bash
# Install dependencies
npm install

# Start development server (Electron + Vite)
npm start
```

### Building
Package the application for distribution:
```bash
# Build for current OS
npm run make

# The output (deb, rpm, zip) will be in the `out` directory.
```

## 📂 Project Structure

```
project_ginger-media-handler/
├── src/
│   ├── main/           # Electron Main Process
│   │   ├── services/   # Business logic (Library, Playlist, Update, Job)
│   │   └── index.ts    # Entry point
│   ├── preload/        # Context Bridge
│   ├── renderer/       # React UI
│   │   ├── components/ # Atomic UI components
│   │   ├── state/      # Zustand stores
│   │   └── App.tsx     # Main application component
│   └── shared/         # Shared TypeScript types
├── resources/          # Static assets (icons)
├── docs/               # Documentation
└── ...config files
```

---

## 🤝 Contributing
1. Create a feature branch.
2. Commit your changes.
3. Open a Pull Request.

Happy Coding! 🎵
