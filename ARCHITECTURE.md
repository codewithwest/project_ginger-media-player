# Project Ginger Media Player - Architecture & Design Document

## 1. Architecture Overview

### High-Level Pattern: The Detached Core
To satisfy the requirements of "background playback", "CLI interactions", and "AI automation", the application will follow a **Client-Server-Controller** model entirely within the Electron ecosystem.

*   **The "Core" (Service Layer):** Runs in the Electron **Main Process** (with potential worker threads/hidden windows). It owns the source of truth for:
    *   Playback State (Playing/Paused, Time, Track)
    *   Playlist / Queue
    *   Download Jobs
    *   System Interactions (Global shortcuts, Tray)
*   **The "View" (Renderer):** A dumb UI layer. It reflects the state provided by the Core. It sends *intents* (User clicked "Play") rather than executing logic. It can be closed/reopened without stopping the music.
*   **The "Playback Engine" (Hidden Renderer):** An invisible `BrowserWindow` dedicated solely to hosting the HTML5 `<video>`/`<audio>` tags and WebAudio nodes. This ensures playback persists even if the main UI window is closed.

### Diagram
```mermaid
graph TD
    User[User / AI / CLI] -->|Commands via IPC/Socket| Main[Main Process (Controller)]
    Main -->|State Updates| UI[UI Window (Renderer)]
    Main -->|Control| Playback[Hidden Playback Window]
    Main -->|Spawn| FFmpeg[FFmpeg Transcoder]
    Main -->|Spawn| YtDlp[yt-dlp Downloader]
```

## 2. Technology Tradeoffs

### Playback Engine: Hybrid HTML5 + Transcoding
*   **Decision:** Use standard HTML5 `<video>` elements (inside the Hidden Window) fed by a local loopback server or streamed file buffers.
*   **Rationale:**
    *   *HTML5 Video:* Extremely stable, hardware accelerated (GPU) by Chromium. Best battery life for standard formats (MP4/WebM/MP3).
    *   *Native Bindings (libVLC/mpv):* Often unstable (node-gyp issues), break with Electron updates, and hard to secure.
    *   *Unsupported Formats (MKV/AVI/FLAC):* Solved via **On-the-fly FFmpeg Transcoding**. The Main Process spawns an FFmpeg stream transforming `file.mkv` -> `stdin` -> `HLS/DASH/MP4 Stream` -> `localhost` -> `<video src="http://localhost:port/stream">`.
*   **Result:** 100% format support (via FFmpeg) with 100% stable UI rendering (via Chrome).

### Downloader: Abstracted `yt-dlp`
*   **Decision:** Use `yt-dlp` binary managed by `ytdlp-nodejs` (or custom wrapper for finer control).
*   **Why:** Best-in-class support for generic sites, not just YouTube.
*   **Abstraction:** We will build a `DownloaderProvider` interface. The implementation `YtDlpAdapter` can be swapped if `yt-dlp` is superseded.

## 3. Folder & Module Structure

The codebase will imply strict separation of scopes.

```text
src/
├── main/                   # Electron Main Process (Node.js)
│   ├── api/                # IPC Handlers & Socket Server (CLI)
│   ├── services/           # Business Logic (Singletons)
│   │   ├── PlaybackManager.ts
│   │   ├── LibraryService.ts
│   │   ├── DownloadService.ts
│   │   └── TranscodeService.ts
│   ├── workers/            # CPU-intensive tasks (Hashing, Parsing)
│   ├── data/               # Database/Store (SQLite or LowDB)
│   └── main.ts             # Entry point
├── renderer/               # React UI Window
│   ├── components/
│   ├── hooks/				# usePlaybackState() (wraps IPC)
│   ├── pages/
│   └── App.tsx
├── playback/               # Hidden Window for Media Element
│   └── player.html         # The actual <video> tag lives here
├── shared/                 # Types, Constants, Utilities
│   ├── types/              # DTOs: PlaybackState, JobStatus
│   ├── contracts/          # IPC Channel Names
│   └── schemas/            # Zod schemas for runtime validation
└── cli/                    # Headless Control Interface
```

## 4. Security Model

### Principles
1.  **Context Isolation:** Enabled. `contextIsolation: true`.
2.  **Sandbox:** Enabled where possible.
3.  **IPC Security:**
    *   No general "eval" IPC calls.
    *   Use specific channels: `playback:play`, `library:query`.
    *   Validate all IPC payloads using `Implements<T>` or Zod schemas at the Main boundary.
4.  **Local Server:** The internal transcoding server must start on `127.0.0.1` and listen *only* to local loopback. Generate a random authentication token on startup that the renderer must append to video URLs (e.g., `http://127.0.0.1:4000/stream?token=xyz`) to prevent other local apps from hijacking the stream.

## 5. Performance Strategy

*   **Virtualization:** The Playlist UI must use virtualization (React Window) to handle lists of 10,000+ songs.
*   **Worker Threads:** File scanning (metadata extraction via `ffprobe`) must happen in a Node.js Worker Thread, never the Main Event Loop.
*   **Streaming:**
    *   Downloads shouldn't block playback.
    *   Transcoding uses standard node Streams (`pipe`), back-pressured to avoid RAM spikes.
*   **Memory:** Isolate the UI. If the User closes the UI, React garbage collection runs. The Main process stays lean.

## 6. CLI & AI Automation Design

### The "Control Socket"
The Main Process will start a Named Pipe (Windows) or Unix Domain Socket (Linux/Mac).

*   **CLI Tool:** A lightweight Node script (`bin/ginger`) that connects to this socket.
*   **Input:** JSON Commands: `{ "command": "play", "uri": "file:///..." }`
*   **Output:** JSON State.

This satisfies the AI requirement: An LLM Agent can simply write JSON to the socket to drive the entire application blindly.

## 7. Roadmap

*   **Phase 1: Architecture Core**
    *   Setup Main/Renderer/Hidden-Window comms.
    *   Implement "Play File" loop (Main -> Transcoder -> Hidden Window).
*   **Phase 2: Data & Library**
    *   SQLite integration.
    *   File scanning worker.
*   **Phase 3: Downloads**
    *   Integrate `ytdlp-nodejs` with Job Queue Manager.
*   **Phase 4: Polish**
    *   React UI themes, visualizations.
    *   CLI implementation.

## 8. Non-Goals (Initial Version)
*   **Sync:** No cloud sync of libraries initially.
*   **Mobile:** Desktop focused only.
*   **Video Editor:** Playback only, no cutting/editing.

---
**Approved by:** Senior Architect
**Date:** 2026-01-23
