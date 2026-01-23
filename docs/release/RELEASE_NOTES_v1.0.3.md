# Release Notes - v1.0.3

## 📊 Real-time Audio Visualizer
Experience your music visually with Ginger's new high-performance visualizer.
- **Dynamic Frequency Bars**: Watch your audio come to life with a real-time bar visualizer that reacts to every beat.
- **Atmospheric Glow**: The visualizer features a curated primary-blue glow that integrates seamlessly with the new glassmorphic UI.
- **Dual-Mode Rendering**: Shows as a full-screen background for audio tracks and as a subtle bottom overlay during video playback.

## 🎛️ 10-Band Parametric Equalizer
Total control over your sound signature.
- **Professional Tuning**: A new 10-band equalizer (from 60Hz to 16kHz) allowing for precise audio adjustments.
- **Glassmorphic Precision**: A dedicated, sleek EQ panel with high-precision sliders and real-time dB feedback.
- **One-Click Reset**: Quickly return to a flat response with the new reset functionality.

## 🎨 Library Enhancements
- **Grid/List Toggle**: Switch between grid and list views for your media library with a single click.
- **One-Click Conversion**: Convert any video to MP3 directly from the library with the new convert button.
- **Auto-Rescan**: Library automatically rescans after conversions to show new files.
- **Instant Playback**: Play button now starts tracks immediately instead of just adding to queue.

## 🎧 Background Playback Architecture
- **Main Process Ownership**: Playback state now lives in the Main process, enabling true background playback.
- **Survive Window Reload**: Your music keeps playing even if you reload or hide the window.
- **System Tray Controls**: Control playback from the system tray with Play/Pause, Next, and Previous.
- **Global Media Keys**: Use your keyboard's media keys to control Ginger from any application.

## 🐛 Bug Fixes
- **Fixed PlaylistSidebar Crash**: Added null safety checks to prevent undefined errors.
- **Fixed Job History**: Completed downloads and conversions now have working play buttons.
- **Fixed Library Play**: Play button in library now correctly starts playback immediately.

## 🛠️ Performance & Audio Engine
- **Web Audio Integration**: Rewrote the audio pipeline to use the Web Audio API for low-latency processing and filtering.
- **Hardware Acceleration**: Componentized the visualizer using HTML5 Canvas for smooth 60FPS rendering without taxing the CPU.
- **Stability Fixes**: Improved media element cross-origin handling to ensure the visualizer works with all stream sources.

---
*Ginger Media Player - Version 1.0.3*
