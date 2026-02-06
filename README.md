# Supercell Hackathon — AI NPC Platformer

A 2D platformer built with **Phaser 3 + React + TypeScript + Vite**, featuring an **AI-powered NPC** that can see the game screen and help the player via the **OpenAI API**.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Add your OpenAI API key
#    Open .env and replace the placeholder:
VITE_OPENAI_API_KEY=sk-your-actual-key-here

# 3. Run the dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Controls

| Key | Action |
|-----|--------|
| Arrow Keys / WASD | Move left/right |
| W / Up Arrow | Jump (when on ground) |
| **H** | Open chat textbox to talk to AI NPC |
| Enter | Submit chat message |
| Escape | Cancel/close chat |

---

## Project Structure

```
src/
├── App.tsx                  # Minimal React wrapper, renders PhaserGame
├── PhaserGame.tsx           # Mounts Phaser canvas into React
├── main.tsx                 # React entry point
└── game/
    ├── main.ts              # Phaser config (1024x768, Arcade Physics, gravity)
    ├── EventBus.ts           # Event emitter for React ↔ Phaser communication
    ├── openai.ts             # OpenAI API client (chat + vision)
    ├── npcConfig.json        # ⭐ AI NPC system prompt & behavior config
    ├── types.ts              # TypeScript interfaces for level JSON schema
    ├── LevelLoader.ts        # Converts level JSON → Phaser game objects
    ├── sampleLevel.ts        # Current level data (editable)
    └── scenes/
        ├── Boot.ts           # Generates textures (player, enemy, pickup, NPC)
        └── Game.ts           # Main gameplay scene (movement, NPC, chat)
```

---

## How the AI NPC Works

1. Player presses **H** → a text input overlay appears
2. Player types a message and presses **Enter**
3. The game **captures a screenshot** of the current canvas
4. The message + screenshot are sent to **OpenAI GPT-4o-mini** (vision-enabled)
5. The NPC's response appears in a speech bubble above the blue square NPC
6. The bubble stays for 15 seconds, then fades out

The AI maintains **conversation history** so it remembers previous exchanges within the session.

---

## Key Files to Modify

### `.env` — API Key
```
VITE_OPENAI_API_KEY=sk-your-key-here
```
⚠️ This key is exposed in the browser (fine for hackathon, not for production).

### `src/game/npcConfig.json` — AI Personality & Prompt
Edit this file to change how the NPC behaves:
```json
{
    "system_prompt": "Core instruction for the AI...",
    "personality": "cheerful, helpful, slightly quirky",
    "rules": [
        "Keep responses under 3 sentences",
        "Stay in character as a game NPC",
        ...
    ],
    "context": "Description of the game world the AI knows about...",
    "greeting": "Hey there! Need help?"
}
```
All fields are combined into a single system prompt sent to OpenAI.

### `src/game/sampleLevel.ts` — Level Data
The entire level is driven by a JSON object with **normalized coordinates (0–1)**. Edit this to change the level layout:
- `surfaces` — platforms (polygon-based)
- `spawns.player` — where the player starts
- `spawns.exit` — the exit zone
- `spawns.enemies` — enemy positions + patrol config
- `spawns.pickups` — collectible positions
- `detections` — detected objects (from image analysis)
- `rules` — gameplay modifiers (e.g. gravity scaling)

### `src/game/openai.ts` — API Settings
- Change `model` (default: `gpt-4o-mini`)
- Adjust `max_tokens`, `temperature`
- Change screenshot `detail` level (`"low"` or `"high"`)

### `src/game/scenes/Game.ts` — Game Logic
- Player movement speed: `playerSpeed` property
- Jump velocity: `-350` in `update()`
- NPC position: set in `loadLevel()`
- Speech bubble duration: `15000ms` delay + `2000ms` fade

---

## Level JSON Schema

The game can load any level matching this schema (all coordinates normalized 0–1):

```json
{
    "image": { "w": 1280, "h": 720 },
    "detections": [
        { "id": "obj_1", "label": "chair", "confidence": 0.78,
          "bbox": { "x": 0.12, "y": 0.35, "w": 0.22, "h": 0.40 },
          "tags": ["solid"] }
    ],
    "spawns": {
        "player": { "x": 0.10, "y": 0.80 },
        "exit": { "x": 0.90, "y": 0.20 },
        "enemies": [{ "type": "crawler", "x": 0.55, "y": 0.78, "patrol": { "dx": 0.15 } }],
        "pickups": [{ "type": "coin", "x": 0.30, "y": 0.55 }]
    },
    "surfaces": [
        { "type": "platform", "poly": [[0.0,0.85],[1.0,0.85],[1.0,0.90],[0.0,0.90]] }
    ],
    "rules": [
        { "id": "low_grav_in_dark", "param": 0.85 }
    ]
}
```

The idea: **generate this JSON from the OpenAI API** (e.g. from analyzing a photo) and feed it to `LevelLoader` to dynamically build levels.

---

## Build for Production

```bash
npm run build
```

Output goes to `dist/`.

---

## Tech Stack

- **Phaser 3** (v3.90+) — 2D game engine with Arcade Physics
- **React 19** — UI layer
- **TypeScript** — Type safety
- **Vite** — Bundler & dev server
- **OpenAI API** — GPT-4o-mini with vision
