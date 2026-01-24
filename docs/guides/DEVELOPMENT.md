# Development Guide

## Getting Started

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project_ginger-media-handler
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

## Development Workflow

### Hot Reload

The application supports hot reload for both the renderer and main processes:

- **Renderer changes**: Automatically reload in the browser
- **Main process changes**: Type `rs` in the terminal to restart

### TypeScript

All code must follow strict TypeScript standards:

- No `any` types (use `unknown` with type guards)
- Explicit return types for public functions
- Strict null checks enabled

### Code Style

- **ESLint**: `npm run lint`
- **Prettier**: Configured for single quotes, trailing commas
- **Path aliases**: Use `@main/*`, `@renderer/*`, `@shared/*`

## Project Structure

```
src/
├── main/
│   ├── index.ts              # Main process entry
│   ├── services/             # Business logic
│   ├── ipc/handlers/         # IPC handlers
│   └── infrastructure/       # External dependencies
├── preload/
│   └── index.ts              # contextBridge API
├── renderer/
│   ├── App.tsx               # Root component
│   ├── components/           # UI components
│   ├── hooks/                # Custom hooks
│   └── state/                # State management
└── shared/
    └── types/                # Shared TypeScript types
```

## IPC Communication

All IPC communication is type-safe:

```typescript
// Renderer
await window.electronAPI.media.play(sourceId);

// Main process handler
ipcMain.handle('media:play', async (_event, { sourceId }) => {
  // Implementation
});
```

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.ts
```

## Building

```bash
# Package for current platform
npm run package

# Create installers for all platforms
npm run make

# Publish (requires configuration)
npm run publish
```

## Debugging

### Main Process

1. Add `debugger` statement in main process code
2. Run with `--inspect` flag
3. Open `chrome://inspect` in Chrome

### Renderer Process

1. Open DevTools (automatically opens in development)
2. Use React DevTools extension
3. Console logs available in DevTools

## Common Issues

### Port Already in Use

If Vite dev server port is in use:
- Kill the process using the port
- Or wait for automatic port selection

### Build Errors

1. Clear build cache: `rm -rf .vite`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check TypeScript errors: `npx tsc --noEmit`

## Performance

### Optimization Tips

- Use React.memo for expensive components
- Lazy load Three.js scenes
- Debounce IPC calls where appropriate
- Monitor memory usage in Task Manager

## Security Checklist

Before committing:
- [ ] No `nodeIntegration: true`
- [ ] No `any` types in IPC contracts
- [ ] Input validation on all IPC handlers
- [ ] No direct file paths from renderer
- [ ] CSP headers configured

## Next Steps

See [PHASE1_WALKTHROUGH.md](PHASE1_WALKTHROUGH.md) for Phase 1 completion details.

For Phase 2 (Media Engine), see the architecture overview.
