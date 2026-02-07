# Scene Generator - Mobile Photo to Game Level

A mobile browser game that converts photos into playable game levels using AI-powered scene generation. Built with React, TypeScript, Phaser 3, and Vite.

## Project Overview

```
User uploads photo
    ↓
CUA+SAM: Segment all objects/surfaces with coordinates
    ↓
GPT-4 Vision: "Table edge = platform, plant = obstacle, mug = coin"
    ↓
Generate Phaser.js game with:
  - Platforms at detected coordinates
  - Obstacles/collectibles from labeled objects
  - Physics based on real image layout

```

**Current Status: MVP Step 2.5 - Photo Capture & Upload Flow**

The app flow:
1. **Capture**: User takes a photo on mobile device
2. **Upload**: Photo is compressed and sent to backend
3. **Generate**: Backend analyzes photo and returns Scene JSON
4. **Play**: (Coming in Step 3) Scene JSON creates a playable Phaser level

## Quick Start

```bash
# Install dependencies
npm install

# Run frontend only (with mock data for testing)
npm run dev

# Run frontend + backend together
npm run dev:all
```

Open on mobile: Check terminal for `Network:` URL (e.g., `http://192.168.1.x:8080`)

## Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies |
| `npm run dev` | Launch frontend dev server |
| `npm run dev:all` | Launch frontend + backend together |
| `npm run server` | Launch backend only (port 3001) |
| `npm run build` | Create production build |

## Project Structure

### Frontend (React + TypeScript)

| Path | Description |
|------|-------------|
| `src/App.tsx` | Main app, renders CaptureAndUploadScreen |
| `src/ui/CaptureAndUploadScreen.tsx` | Orchestrates capture → upload flow |
| `src/ui/CameraCapture.tsx` | Mobile camera access + image compression |
| `src/ui/UploadFlow.tsx` | Upload state machine + dev toggles |
| `src/ui/screens/` | Loading, Success, Error screen components |
| `src/services/ai_proxy_service.ts` | Backend API client |
| `src/services/image_processing_service.ts` | Image downscaling utilities |
| `src/services/request_trace.ts` | Request ID generation for logging |

### Backend (Express + TypeScript)

| Path | Description |
|------|-------------|
| `server/index.ts` | Express server entry point |
| `server/routes/scene.ts` | POST /api/scene endpoint (dummy implementation) |
| `server/tsconfig.json` | Backend TypeScript config |

### Documentation

| Path | Description |
|------|-------------|
| `docs/backend_contract.md` | **API specification for backend team** |
| `docs/testing_upload.md` | Testing guide with curl examples |

## For Backend Developers

**Start here:** `docs/backend_contract.md`

This file contains:
- API endpoint specification (POST /api/scene)
- Request/response format
- CORS configuration
- curl test commands
- Logging recommendations

### Backend-Related Files

```
docs/
├── backend_contract.md      # API specification (START HERE)
└── testing_upload.md        # Testing guide

server/
├── index.ts                 # Express server setup
├── routes/scene.ts          # Dummy endpoint (replace with real AI)
└── tsconfig.json            # TypeScript config

src/services/
└── ai_proxy_service.ts      # Frontend client (shows expected API format)
```

### Quick Test with curl

```bash
# Start backend
npm run server

# Test endpoint
curl -i -X POST "http://localhost:3001/api/scene" \
  -H "x-request-id: req_TEST" \
  -F "image=@photo.jpg"
```

## Dev Panel (Development Mode)

A floating panel appears in the bottom-right corner during development with these toggles:

**Backend section:**
- **Demo Random**: 50/50 chance to show fake error after real success (for testing error UI)
- **Mock Fallback**: Try backend first, fall back to mock data on error (for demos)

**No Backend section:**
- **Mock Mode**: Skip backend entirely, always return mock data

**Display:**
- **Image Info**: Show compression stats after photo capture

## Tech Stack

- **Frontend**: React 19, TypeScript 5.7, Vite 6.3
- **Game Engine**: Phaser 3.90
- **Backend**: Express, Multer (multipart uploads)
- **Styling**: Vanilla CSS with glassmorphism
- **Icons**: React Lucide
---

# Original Phaser Template Documentation

The sections below are from the original Phaser React TypeScript template.

## React Bridge

The `PhaserGame.tsx` component is the bridge between React and Phaser. It initializes the Phaser game and passes events between the two.

To communicate between React and Phaser, you can use the **EventBus.js** file. This is a simple event bus that allows you to emit and listen for events from both React and Phaser.

```js
// In React
import { EventBus } from './EventBus';

// Emit an event
EventBus.emit('event-name', data);

// In Phaser
// Listen for an event
EventBus.on('event-name', (data) => {
    // Do something with the data
});
```

In addition to this, the `PhaserGame` component exposes the Phaser game instance along with the most recently active Phaser Scene using React forwardRef.

## Phaser Scene Handling

In Phaser, the Scene is the lifeblood of your game. It is where you sprites, game logic and all of the Phaser systems live. You can also have multiple scenes running at the same time.

**Important**: When you add a new Scene to your game, make sure you expose to React by emitting the `"current-scene-ready"` event via the `EventBus`:

```ts
class MyScene extends Phaser.Scene
{
    constructor ()
    {
        super('MyScene');
    }

    create ()
    {
        // Your Game Objects and logic here

        // At the end of create method:
        EventBus.emit('current-scene-ready', this);
    }
}
```

## Handling Assets

Vite supports loading assets via JavaScript module `import` statements.

To embed an asset:
```js
import logoImg from './assets/logo.png'
```

To load static files, place them in `public/assets`:
```js
preload ()
{
    this.load.image('logo', logoImg);
    this.load.image('background', 'assets/bg.png');
}
```

## Deploying to Production

Run `npm run build` to create a production bundle in the `dist` folder. Upload all contents of `dist` to your web server.

## About log.js

The `log.js` file sends anonymous usage data to Phaser Studio. To disable:
- Use `npm run dev-nolog` or `npm run build-nolog`
- Or delete `log.js` and remove references in `package.json`

## Phaser Community

**Visit:** [phaser.io](https://phaser.io) | **Discord:** [discord.gg/phaser](https://discord.gg/phaser) | **Docs:** [newdocs.phaser.io](https://newdocs.phaser.io)

Created by [Phaser Studio](mailto:support@phaser.io). The Phaser logo and characters are © 2011 - 2025 Phaser Studio Inc.


