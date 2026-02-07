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

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm install`     | Install project dependencies       |
| `npm run dev`     | Launch frontend dev server         |
| `npm run dev:all` | Launch frontend + backend together |
| `npm run server`  | Launch backend only (port 3001)    |
| `npm run build`   | Create production build            |

## Project Structure

### Frontend (React + TypeScript)

| Path                                       | Description                               |
| ------------------------------------------ | ----------------------------------------- |
| `src/App.tsx`                              | Main app, renders CaptureAndUploadScreen  |
| `src/ui/CaptureAndUploadScreen.tsx`        | Orchestrates capture → upload flow        |
| `src/ui/CameraCapture.tsx`                 | Mobile camera access + image compression  |
| `src/ui/UploadFlow.tsx`                    | Upload state machine + dev toggles        |
| `src/ui/screens/`                          | Loading, Success, Error screen components |
| `src/services/ai_proxy_service.ts`         | Backend API client                        |
| `src/services/image_processing_service.ts` | Image downscaling utilities               |
| `src/services/request_trace.ts`            | Request ID generation for logging         |

### Backend (Express + TypeScript)

| Path                     | Description                                     |
| ------------------------ | ----------------------------------------------- |
| `server/index.ts`        | Express server entry point                      |
| `server/routes/scene.ts` | POST /api/scene endpoint (dummy implementation) |
| `server/tsconfig.json`   | Backend TypeScript config                       |

### Documentation

| Path                       | Description                            |
| -------------------------- | -------------------------------------- |
| `docs/backend_contract.md` | **API specification for backend team** |
| `docs/testing_upload.md`   | Testing guide with curl examples       |

## For Backend Developer

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

### AI Structured Response Example in JSON

## Overview

The AI returns a single JSON object describing detected items in the photo and how each item should behave in-game. Each item is an entry in `objects[]`. The game uses `bounds_normalized` as the source of truth and converts to world coordinates deterministically.

## Top-level

```json
{
  "version": 1,
  "image": { "width": 4032, "height": 3024 },
  "objects": []
}

{
  "id": "pillow_01",
  "type": "platform",
  "label": "pillow",
  "confidence": 0.78,
  "bounds_normalized": { "x": 0.15, "y": 0.42, "width": 0.25, "height": 0.10 },
  "properties": { },
  "game_mechanics": { }
}
```

## Example JSON

```json
{
    "version": 1,
    "image": { "width": 4032, "height": 3024 },
    "objects": [
        {
            "id": "pillow_01",
            "type": "platform",
            "label": "pillow",
            "confidence": 0.78,
            "bounds_normalized": {
                "x": 0.15,
                "y": 0.42,
                "width": 0.25,
                "height": 0.1
            },
            "properties": { "surface_type": "soft" },
            "game_mechanics": {
                "is_solid": true,
                "player_speed_multiplier": 0.6,
                "jump_height_multiplier": 1.2,
                "friction": 0.3,
                "bounciness": 0.6
            }
        },
        {
            "id": "apple_01",
            "type": "collectible",
            "label": "apple",
            "confidence": 0.72,
            "bounds_normalized": {
                "x": 0.62,
                "y": 0.38,
                "width": 0.06,
                "height": 0.08
            },
            "properties": { "category": "food", "edible": true },
            "game_mechanics": {
                "pickup_type": "health_pack",
                "health_restore": 20
            }
        }
    ]
}
```

## Object schema

Each entry in `objects[]` must include the following fields:

- `id`  
  Unique string identifier within the response.

- `type`  
  One of the allowed object types (see enums below).

- `label`  
  Human-readable object name (e.g. pillow, table, apple).

- `confidence`  
  Float between `0.0` and `1.0`.

- `bounds_normalized`  
  Normalized bounding box.

- `properties`  
  Descriptive, non-behavioral metadata.

- `game_mechanics`  
  Gameplay-relevant behavior modifiers.

---

## Normalized bounds (critical)

`bounds_normalized` is the **source of truth**.

Fields:

- `x` – left offset (0.0 → 1.0)
- `y` – top offset (0.0 → 1.0)
- `width` – width (0.0 → 1.0)
- `height` – height (0.0 → 1.0)

Rules:

- All values must be floats between `0.0` and `1.0`
- `(x, y)` is the top-left corner
- `width` and `height` must be greater than 0
- The box must fit inside the image:
    - `x + width <= 1.0`
    - `y + height <= 1.0`

The game engine converts these values into world coordinates.

## Allowed values for type

Object type enum

- platform
- obstacle
- collectible
- hazard
- decoration

## Property enums

### Surface type (platform / obstacle / hazard)

Allowed values:

- hard
- soft
- slippery
- sticky

## Gameplay mechanic enums

### Collectibles

- `pickup_type`:
    - coin
    - health_pack

### Hazards

- `damage_type`:
    - touch_damage
    - damage_zone

---

## Gameplay value clamping (engine-enforced)

The AI may suggest values, but the game engine must clamp them.

### Movement & physics

- player_speed_multiplier: 0.5 → 1.2
- jump_height_multiplier: 0.7 → 1.4
- friction: 0.0 → 1.0
- bounciness: 0.0 → 0.8

### Collectibles

- health_restore: 0 → 50

### Hazards

- damage_amount: 1 → 50
- slow_multiplier: 0.4 → 1.0

## Type-specific rules

### Platforms

Required:

- properties.surface_type

Allowed mechanics:

- is_solid (boolean, default true)
- player_speed_multiplier
- jump_height_multiplier
- friction
- bounciness

### Obstacles

Allowed mechanics:

- is_solid
- optional damage_amount

### Collectibles

Required:

- game_mechanics.pickup_type

Allowed mechanics:

- health_restore (only if pickup_type is health_pack)

### Hazards

Required:

- game_mechanics.damage_type
- game_mechanics.damage_amount

Allowed mechanics:

- slow_multiplier

### Decorations

- No gameplay mechanics required
- Safe for the engine to ignore

---

## Hard caps (AI must respect)

- Maximum total objects: 25
- Maximum per type:
    - platform: 12
    - obstacle: 8
    - collectible: 10
    - hazard: 8
    - decoration: 25

If more objects are detected, the AI should return the most visually prominent ones.

## AI output rules (strict)

- Return valid JSON only
- No comments, markdown, or explanations
- Use only enums defined in this document
- Always include image.width and image.height
- Prefer normalized bounds
- Respect all caps and ranges

---

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
import { EventBus } from "./EventBus";

// Emit an event
EventBus.emit("event-name", data);

// In Phaser
// Listen for an event
EventBus.on("event-name", (data) => {
    // Do something with the data
});
```

In addition to this, the `PhaserGame` component exposes the Phaser game instance along with the most recently active Phaser Scene using React forwardRef.

## Phaser Scene Handling

In Phaser, the Scene is the lifeblood of your game. It is where you sprites, game logic and all of the Phaser systems live. You can also have multiple scenes running at the same time.

**Important**: When you add a new Scene to your game, make sure you expose to React by emitting the `"current-scene-ready"` event via the `EventBus`:

```ts
class MyScene extends Phaser.Scene {
    constructor() {
        super("MyScene");
    }

    create() {
        // Your Game Objects and logic here

        // At the end of create method:
        EventBus.emit("current-scene-ready", this);
    }
}
```

## Handling Assets

Vite supports loading assets via JavaScript module `import` statements.

To embed an asset:

```js
import logoImg from "./assets/logo.png";
```

To load static files, place them in `public/assets`:

```js
preload();
{
    this.load.image("logo", logoImg);
    this.load.image("background", "assets/bg.png");
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

