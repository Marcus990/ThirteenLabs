# Thirteen Labs Frontend

Next.js frontend for the Thirteen Labs video-to-game application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

## Running

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- Video upload with drag & drop
- Real-time processing status
- 3D game rendering with Three.js
- Responsive design with Tailwind CSS

## Development

The frontend uses:
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- Three.js for 3D rendering
- Axios for API communication
- Lucide React for icons

## Build

```bash
npm run build
npm start
``` 