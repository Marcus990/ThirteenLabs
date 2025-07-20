# Thirteen Labs Video Recorder

A Next.js application for recording video streams with real-time MP4 conversion using FFmpeg.wasm.

## Features

- Real-time video stream recording via WebSocket
- Client-side video conversion from WebM to MP4 using FFmpeg.wasm
- Modern React-based UI with TypeScript
- Progress tracking for video conversion
- Automatic file naming with timestamps

## Prerequisites

- Node.js 18+ 
- npm or yarn
- A WebSocket server running on `ws://qnxpi-andrew.local:8080/` (or update the URL in the code)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Connect**: Click the "Connect" button to establish a WebSocket connection to your video stream server.

2. **Start Recording**: Once connected, click "Start Recording" to begin capturing the video stream.

3. **Stop Recording**: Click "Stop Recording" to end the recording session.

4. **Download**: The video will be automatically converted to MP4 format and made available for download.

## Technical Details

### Video Conversion Process

1. The application records video using the browser's MediaRecorder API in WebM format
2. FFmpeg.wasm is used to convert the WebM video to MP4 format on the client side
3. The conversion uses H.264 video codec and AAC audio codec for maximum compatibility

### FFmpeg Configuration

The video conversion uses the following FFmpeg parameters:
- `-c:v libx264`: H.264 video codec
- `-preset fast`: Fast encoding preset for reasonable speed/quality balance
- `-crf 23`: Constant Rate Factor for good quality
- `-c:a aac`: AAC audio codec
- `-b:a 128k`: 128kbps audio bitrate

### Browser Compatibility

This application requires a modern browser with support for:
- WebSocket API
- MediaRecorder API
- Canvas API
- WebAssembly (for FFmpeg.wasm)

## Configuration

### WebSocket Server URL

To change the WebSocket server URL, update the URL in `app/page.tsx`:

```typescript
const ws = new WebSocket("ws://your-server-url:port/");
```

### Video Quality Settings

To adjust video quality, modify the FFmpeg parameters in the `createVideoBlob` function:

```typescript
await ffmpegRef.current.exec([
  '-i', 'input.webm',
  '-c:v', 'libx264',
  '-preset', 'fast',  // Change to 'slow' for better quality
  '-crf', '23',       // Lower values = better quality (18-28 range)
  '-c:a', 'aac',
  '-b:a', '128k',
  'output.mp4'
]);
```

## Development

### Project Structure

```
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main video recorder component
├── public/
│   └── ffmpeg/              # FFmpeg core files (downloaded from CDN)
├── package.json             # Dependencies and scripts
├── next.config.js           # Next.js configuration
└── tsconfig.json            # TypeScript configuration
```

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

## Troubleshooting

### FFmpeg Loading Issues

If FFmpeg fails to load, check:
1. Browser supports WebAssembly
2. CORS headers are properly configured
3. Network connectivity to unpkg.com

### WebSocket Connection Issues

If connection fails:
1. Verify the WebSocket server is running
2. Check the server URL in the code
3. Ensure the server accepts connections from your domain

### Video Conversion Errors

If video conversion fails:
1. Check browser console for detailed error messages
2. Ensure the recorded video has valid content
3. Try reducing video quality settings

## License

This project is open source and available under the MIT License.
