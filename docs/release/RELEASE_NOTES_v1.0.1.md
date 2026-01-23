# Release Notes - v1.0.1

## Overview
This release focuses on **persistence** and **reliability**. We've added local storage for your settings and download history, and significantly improved the accuracy of media title extraction for a better user experience.

---

## 🚀 Improvements & Fixes

### 1. Persistence & Settings
- **Persistent Downloads Path**: The app now remembers your custom-selected downloads folder across restarts.
- **Download History**: Your recent downloads and conversions are now saved locally. You can view your full history in the Download Manager even after restarting the app.
- **Settings Service**: Introduced a centralized service for managing app preferences and historical data.

### 2. Smarter YouTube Downloads
- **Clean Naming**: Automatically strips "Mix - " and "Radio -" prefixes from YouTube titles for cleaner dashboard entries.
- **Single-Video Mode**: Forced logic to ignore YouTube Mix/Playlist containers when downloading, ensuring the specific song at your current index is the one named and saved.
- **Title Tag resolution**: Improved probe logic to ensure the name on disk matches the name in your dashboard perfectly.

### 3. Playback & Stability
- **Fixed 404 Playback Errors**: Resolved a critical bug where terminal logs were being treated as file paths, causing playback failures.
- **Path Verification**: The app now verifies files exist on disk before attempting playback, with automatic "fuzzy-search" logic to find files if post-processing changed their extension.
- **Logging Cleanup**: Removed excessive JSON logging from the main process to improve performance and terminal readability.
- **Reduced Flashing**: Optimized the download progress bar to avoid "stuck at 10%" behavior and provide smoother early-stage feedback.

---

## 📋 Installation
Download the appropriate package for your system:

**Linux (.deb)**
```bash
sudo dpkg -i ginger-media-player_1.0.1_amd64.deb
```

**Linux (.AppImage)**
```bash
chmod +x Ginger-Media-Player-1.0.1.AppImage
./Ginger-Media-Player-1.0.1.AppImage
```

---

**Release Date**: January 23, 2026
**Version**: 1.0.1
**Maintained by**: Jonas Lekgau (@codewithwest)
