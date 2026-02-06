# Backend API Contract: Scene Generation

This document specifies the API that the frontend expects for scene generation.

## Endpoint

```
POST /api/scene
```

## Request

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Auto | `multipart/form-data` (set automatically by browser) |
| `x-request-id` | Optional | Unique request ID for tracing (e.g., `req_k7x2m9p4`) |

### Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | File | Yes | The photo file (JPEG, usually compressed to ~100-300KB) |

## Response

### Success (200 OK)

```json
{
  "version": 1,
  "image": {
    "w": 1024,
    "h": 768
  },
  "detections": [
    {
      "id": "det_001",
      "type": "object",
      "label": "chair",
      "confidence": 0.92,
      "bbox": { "x": 100, "y": 200, "w": 150, "h": 200 }
    }
  ],
  "spawns": {
    "player": { "x": 0.1, "y": 0.9 },
    "exit": { "x": 0.9, "y": 0.1 },
    "enemies": [
      { "x": 0.5, "y": 0.5, "type": "walker" }
    ],
    "pickups": [
      { "x": 0.3, "y": 0.7, "type": "coin" }
    ]
  },
  "surfaces": [
    {
      "type": "platform",
      "points": [
        { "x": 0.0, "y": 0.8 },
        { "x": 0.4, "y": 0.8 }
      ]
    }
  ],
  "rules": []
}
```

### Error (4xx/5xx)

```json
{
  "error": "Description of what went wrong"
}
```

## CORS

During development, the backend must allow requests from the frontend origin:

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, x-request-id
```

For Express, use the `cors` middleware:

```typescript
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-request-id'],
}));
```

## Testing with curl

### Basic Upload

```bash
curl -i -X POST "http://localhost:3001/api/scene" \
  -H "x-request-id: req_CURLTEST" \
  -F "image=@/path/to/photo.jpg"
```

### Expected Response

```
HTTP/1.1 200 OK
Content-Type: application/json
x-request-id: req_CURLTEST

{"version":1,"image":{"w":1024,"h":768},...}
```

## Logging Recommendations

For each request, log:

1. **Request received**: `[INFO] ${timestamp} request=${requestId} received image size=${bytes}`
2. **Processing**: `[INFO] ${timestamp} request=${requestId} processing started`
3. **Response sent**: `[INFO] ${timestamp} request=${requestId} response sent status=200`

Example log output:
```
[INFO] 2025-02-05T14:30:00 request=req_k7x2m9p4 received image size=245760
[INFO] 2025-02-05T14:30:01 request=req_k7x2m9p4 processing started
[INFO] 2025-02-05T14:30:03 request=req_k7x2m9p4 response sent status=200
```

This makes it easy to trace requests across frontend and backend logs.

## Implementation Notes

1. **Memory-only file handling**: Store uploaded files in memory (don't persist to disk)
2. **Image validation**: Verify the uploaded file is a valid image
3. **Size limits**: Recommend 5MB max upload size (frontend compresses to ~300KB)
4. **Timeout**: Frontend expects response within 30 seconds

## Quick Start (Express + TypeScript)

```typescript
import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: 'http://localhost:5173' }));

app.post('/api/scene', upload.single('image'), (req, res) => {
  const requestId = req.headers['x-request-id'] || 'unknown';
  const file = req.file;
  
  if (!file) {
    return res.status(400).json({ error: 'No image provided' });
  }
  
  console.log(`[${requestId}] Received ${file.size} bytes`);
  
  // TODO: Process image and generate scene
  const scene = { version: 1, /* ... */ };
  
  res.json(scene);
});

app.listen(3001, () => console.log('Backend running on :3001'));
```
