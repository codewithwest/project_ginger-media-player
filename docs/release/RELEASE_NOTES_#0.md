# Release Notes - v1.0.0 (PR #0)

## Overview
This is the inaugural release of the **Ginger Media Player**, a modern, cross-platform media player built with Electron, React, and TypeScript. It features a robust media engine, library management, playlist persistence, and a sleek, dark-themed UI.

---

## 🚀 Features & Capabilities

### 1. Robust Media Engine
- **Local Media Server**: Streaming support for local files with Range request handling.
- **Format Support**: Direct playback for MP4/WebM and on-the-fly transcoding for MKV/AVI via FFmpeg.
- **Audio Context**: Integrated HTML5 Audio/Video with visualization support (Three.js background).

### 2. Media Library Management
- **Folder Scanning**: efficient scanning of local directories for media files.
- **Virtualization**: Optimized grid view capable of rendering thousands of items smoothly.
- **Metadata Extraction**: Automatic extraction of ID3 tags and video metadata.
- **Persistence**: Library state survives application restarts.

### 3. Smart Playlist Persistence
- **Automatic Saving**: Playlist state is persisted to disk JSON instantly.
- **Restoration**: Seamlessly resumes your playlist from where you left off.
- **Drag & Drop**: (Coming soon) Support for managing queue order.

### 4. Background & System Integration
- **System Tray**: Minimizes to tray for background playback.
- **Media Keys**: Global shortcuts for Play/Pause, Next, Previous.
- **Auto-Updater**: Integrated update mechanism to pull latest releases from GitHub.

### 5. Download & Conversion (Beta)
- **YouTube-DL Integration**: Download audio/video from URLs.
- **Format Conversion**: Convert media files between formats using FFmpeg.

---

## 🛠 Tech Stack
- **Core**: Electron, React 18, TypeScript, Vite.
- **State**: Zustand for performant state management.
- **Styling**: TailwindCSS v4 with custom animations.
- **Backend**: Express (Local Server), Fluent-FFmpeg, SQLite (planned).
- **Virtualization**: `react-window` for list performance.

---

## 📋 Installation
Download the appropriate package for your system:

**Linux (.deb)**
```bash
sudo dpkg -i ginger-media-player_1.0.0_amd64.deb
```

**Linux (.AppImage)**
```bash
chmod +x Ginger-Media-Player-1.0.0.AppImage
./Ginger-Media-Player-1.0.0.AppImage
```

---

**Release Date**: January 11, 2026
**Version**: 1.0.0
**Maintained by**: Jonas Lekgau (@codewithwest)
