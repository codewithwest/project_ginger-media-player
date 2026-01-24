# Release Notes - v1.0.5

## 🌐 Media Server Integration (Phase 3)
Ginger Media Player now acts as a connected hub for all your home media.

- **Auto-Discovery (DLNA)**: Automatically finds media servers (like Plex, Jellyfin, Kodi, or Windows Media Sharing) on your local network using SSDP.
- **Network Browser**: A new dedicated "Network" view allows you to browse folders and files on discovered devices.
- **Seamless Playback**: Stream video and audio directly from network sources without downloading.
- **SMB Support**: Foundational support for Windows/NAS shares (beta connectivity).

## 🛠️ Architecture
- **Stream Proxy**: Implemented a main-process proxy to handle complex network streams and protocols, ensuring compatibility with the renderer.
- **Unified Media Source**: Updated internal types to treat local files and network streams uniformly.

## 🐛 Fixes & Improvements
- **Robust State Management**: Fixed duplicate state declarations in the UI ensuring stability.
- **Linting**: maintained strict compliance with 0 lint errors throughout the new feature implementation.

## 🔌 Plugin Architecture (Phase 1)
Ginger is now extensible! We have introduced a foundational plugin system that allows developers and automation scripts to hook into the media player.

- **Dynamic Loading**: Plugins are loaded from the user configuration directory (`~/.config/ginger-media-handler/plugins` on Linux).
- **Expansion API**: Plugins can now listen to playback events and interact with the app's internal logging.
- **Sandbox Bridge**: A secure API object is provided to plugins to ensure stability.

## ⏯️ Resume Playback
Never lose your place again. Ginger now automatically saves your progress for every media item.

- **Smart Resume**: When you return to a track, Ginger auto-seeks to your last position (if you were more than 5 seconds in).
- **Persistent State**: Progress is saved across sessions in your settings.

## 🛠️ Architecture
- **Event-Driven Core**: Refactored `PlaybackService` to be fully event-driven, allowing for better synchronization between core logic and extensions.
- **Reliable Persistance**: Enhanced `SettingsService` with fine-grained state management.

---
*Ginger Media Player - Version 1.0.5*
