# Ginger Media Player - CLI Documentation

The Ginger CLI provides a headless interface to control media playback, manage your library, convert files, and download media - all from the command line.

## Installation

The CLI is automatically available when you install Ginger Media Player. You can access it via:

```bash
npm run cli -- [command] [options]
```

Or if installed globally:

```bash
ginger [command] [options]
```

## Commands

### Playback Control

#### Play
Play a media file or resume playback:

```bash
# Play a specific file
ginger play /path/to/song.mp3

# Resume playback
ginger play

# JSON output
ginger play /path/to/song.mp3 --json
```

#### Pause
Pause current playback:

```bash
ginger pause

# JSON output
ginger pause --json
```

#### Stop
Stop playback:

```bash
ginger stop

# JSON output
ginger stop --json
```

#### Next
Skip to next track:

```bash
ginger next

# JSON output
ginger next --json
```

#### Previous
Go to previous track:

```bash
ginger previous

# JSON output
ginger previous --json
```

#### Status
Get current playback status:

```bash
ginger status

# JSON output
ginger status --json
```

### Media Conversion

Convert media files to different formats:

```bash
# Convert to MP3 (default)
ginger convert input.mkv output.mp3

# Specify format and quality
ginger convert input.mp4 output.aac --format aac --quality high

# Available formats: mp3, aac, wav, flac
# Available qualities: low, medium, high

# JSON output
ginger convert input.mkv output.mp3 --json
```

### Media Download

Download media from URLs (YouTube, etc.):

```bash
# Download to current directory
ginger download "https://youtube.com/watch?v=..."

# Specify output directory
ginger download "https://youtube.com/watch?v=..." --output ~/Music

# Download audio only
ginger download "https://youtube.com/watch?v=..." --format audio

# Available formats: best, audio, video

# JSON output
ginger download "https://youtube.com/watch?v=..." --json
```

### Library Management

Manage your media library:

```bash
# Add folder to library
ginger library --add ~/Music

# Scan library for new files
ginger library --scan

# List all tracks
ginger library --list

# JSON output
ginger library --list --json
```

### Playlist Management

Manage playlists:

```bash
# Add file to playlist
ginger playlist --add /path/to/song.mp3

# List playlist
ginger playlist --list

# Clear playlist
ginger playlist --clear

# JSON output
ginger playlist --list --json
```

## JSON Output

All commands support `--json` or `-j` flag for machine-readable output. This is useful for:
- Scripting and automation
- Integration with other tools
- AI/bot integration
- Parsing in other applications

Example JSON output:

```json
{
  "status": "completed",
  "output": "/home/user/Music/song.mp3",
  "format": "mp3",
  "quality": "high"
}
```

## Examples

### Batch Conversion
Convert all MKV files in a directory to MP3:

```bash
for file in *.mkv; do
  ginger convert "$file" "${file%.mkv}.mp3" --quality high
done
```

### Download Playlist
Download and convert a YouTube playlist to audio:

```bash
ginger download "https://youtube.com/playlist?list=..." --format audio --output ~/Music/Playlist
```

### Automated Library Management
Add multiple folders and scan:

```bash
ginger library --add ~/Music
ginger library --add ~/Downloads/Music
ginger library --scan
```

### Scripted Playback
Create a simple music player script:

```bash
#!/bin/bash
# play-random.sh

# Get random track from library
TRACK=$(ginger library --list --json | jq -r '.tracks[0].path')

# Play it
ginger play "$TRACK"
```

## AI Integration

The CLI is designed to be AI-friendly with:
- **Deterministic behavior**: Same input always produces same output
- **JSON output**: Easy parsing for AI systems
- **Clear error messages**: Helpful for debugging
- **Stateless commands**: No hidden state dependencies

Example AI prompt:
```
"Download this YouTube video and convert it to MP3 in high quality"
→ ginger download "URL" --format audio --output ~/Music --json
```

## Exit Codes

- `0`: Success
- `1`: Error (conversion failed, download failed, etc.)

## Notes

- All file paths are automatically resolved to absolute paths
- The CLI reuses the same core services as the GUI
- Playback state is shared between CLI and GUI
- Progress is shown for long-running operations (conversion, download)

## Troubleshooting

### Command not found
Make sure you're using `npm run cli --` or have installed Ginger globally.

### Permission denied
Ensure the CLI script has execute permissions:
```bash
chmod +x dist/cli.js
```

### FFmpeg not found
The CLI will automatically download FFmpeg on first use. If this fails, you can manually install FFmpeg on your system.

---

For more information, run:
```bash
ginger --help
ginger [command] --help
```
