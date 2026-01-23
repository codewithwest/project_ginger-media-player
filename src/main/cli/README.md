# CLI Architecture

This directory contains the modular CLI implementation for Ginger Media Player.

## Structure

```
cli/
├── commands/           # Command modules (one per feature)
│   ├── PlaybackCommands.ts
│   ├── ConversionCommands.ts
│   ├── DownloadCommands.ts
│   ├── LibraryCommands.ts
│   └── PlaylistCommands.ts
├── utils/             # Shared utilities
│   ├── output.ts      # Output formatting
│   └── services.ts    # Service initialization
└── CommandRegistry.ts # Command registration
```

## Design Principles

### 1. **Single Responsibility**
Each command class handles one feature area (playback, conversion, etc.)

### 2. **DRY (Don't Repeat Yourself)**
- Shared utilities in `utils/`
- Service initialization is centralized
- Output formatting is consistent

### 3. **Separation of Concerns**
- **cli.ts**: Entry point only
- **CommandRegistry**: Orchestration
- **Commands**: Business logic
- **Utils**: Cross-cutting concerns

### 4. **Service Reuse**
All commands use the same services as the GUI:
- `ConversionService`
- `DownloadService`
- `LibraryService`
- `PlaylistService`

### 5. **Testability**
Each command class can be tested independently.

## Adding New Commands

1. Create a new file in `commands/`:
```typescript
import { Command } from 'commander';
import { app } from 'electron';

export class MyCommands {
  constructor(private program: Command) {}

  register(): void {
    this.program
      .command('mycommand')
      .description('My command description')
      .action(async () => {
        // Implementation
        app.quit();
      });
  }
}
```

2. Register in `CommandRegistry.ts`:
```typescript
import { MyCommands } from './commands/MyCommands';

// In registerAll():
new MyCommands(this.program).register();
```

## Best Practices

- ✅ Always call `app.quit()` at the end of actions
- ✅ Support `--json` flag for machine-readable output
- ✅ Use utilities from `utils/output.ts` for consistency
- ✅ Handle errors gracefully with proper exit codes
- ✅ Keep command files under 100 lines
- ✅ Extract complex logic into separate services

## Benefits of This Architecture

1. **Maintainability**: Easy to find and update specific commands
2. **Scalability**: Adding new commands doesn't bloat existing files
3. **Readability**: Clear separation makes code self-documenting
4. **Testability**: Each module can be unit tested
5. **Reusability**: Utilities and services are shared
