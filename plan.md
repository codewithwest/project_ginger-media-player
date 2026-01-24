# Future Roadmap

Based on the completion of Phase 3 (Media Servers) and Phase 4.1 (Foundational Plugins & Resume), the following items are prioritized for next development sessions.

## 🔌 Phase 4.2: Advanced Plugin System
Enhance the plugin architecture to allow for deeper app customization.

- [ ] **UI Hooking API**:
    - Allow plugins to register custom tabs/views in the sidebar.
    - Implement a "Dashboard Widget" system for the home view.
- [ ] **Custom Media Providers**:
    - Let plugins add new source types (e.g., YouTube, Podcasts, Internet Radio).
    - Expose the backend `TranscoderService` to plugins for stream manipulation.
- [ ] **Plugin Settings Interface**:
    - Automatically generate settings panels for plugins based on a schema.

## ⚡ Phase 5: Performance & Network Optimization
Refine the core engine for a smoother experience across all network environments.

- [ ] **Intelligent Buffering**:
    - Implement pre-fetching logic for network streams.
    - Add user-tunable buffer sizes in Settings for high-latency connections.
- [ ] **Profiling & Hardware Acceleration**:
    - Profile CPU/GPU usage during 4K network playback.
    - Ensure DXVA2/VAAPI/VideoToolbox are fully utilized across platforms.
- [ ] **Thumbnail Generation Service**:
    - Efficiently generate and cache thumbnails for local and network media.

## 🎞️ Phase 6: Extended Media Capabilities
Expanding Ginger's utility beyond basic playback.

- [ ] **Dedicated Video-to-Audio Converter**:
    - High-quality extraction (MP3/FLAC/AAC) with metadata preservation.
    - Batch processing support.
- [ ] **Vibrant Image Browser**:
    - Dedicated view for photorealistic image browsing.
    - Support for high-res formats and simple slideshow logic.
- [ ] **Advanced Playback Controls**:
    - Variable playback speed (0.25x to 4.0x) for video and audio.
    - Pitch correction during speed adjustments.

## ✨ UI/UX Refinement
Final polish to elevate the premium feel of the application.

- [ ] **Micro-Interactions**:
    - Add smooth transitions for server discovery and folder browsing.
    - Implement a "Loading Shimmer" effect for network lists.
- [ ] **Refined SMB Auth Flow**:
    - Create a polished modal for credential entry when connecting to secured shares.
- [ ] **Global Search**:
    - Unified search across library, network servers, and plugins.

---
*Ginger Media Player Roadmap - Updated 2026-01-24*
