import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import { readFileSync } from 'fs';
import OpenAI from 'openai';

const openai = new OpenAI(); // reads OPENAI_API_KEY from env

export const config = {
    api: {
        bodyParser: false, // disable body parsing so formidable can handle multipart
    },
};

const SYSTEM_PROMPT = `You are a computer-vision AI for a 2D platformer game called Reality Jump.

You receive a photo of a real-world environment (e.g. a room, desk, outdoor scene).
Your job is to identify objects in the photo and map them to game objects for a 2D side-scrolling platformer.

Return ONLY valid JSON (no markdown, no backticks, no explanation) matching this exact schema:

{
  "version": 1,
  "image": { "w": <image_width_px>, "h": <image_height_px> },
  "objects": [
    {
      "id": "<unique_string>",
      "type": "platform" | "obstacle" | "collectible" | "hazard",
      "label": "<what the real-world object is>",
      "confidence": <0.0-1.0>,
      "bounds_normalized": { "x": <0.0-1.0>, "y": <0.0-1.0>, "w": <0.0-1.0>, "h": <0.0-1.0> },
      "surface_type": "solid" | "soft",
      "category": "furniture" | "food" | "plant" | "electric" | "other",
      "enemy_spawn_anchor": <boolean>
    }
  ],
  "spawns": {
    "player": { "x": <0.0-1.0>, "y": <0.0-1.0> },
    "exit": { "x": <0.0-1.0>, "y": <0.0-1.0> },
    "enemies": [{ "x": <0.0-1.0>, "y": <0.0-1.0>, "type": "walker" }],
    "pickups": [{ "x": <0.0-1.0>, "y": <0.0-1.0>, "type": "coin" | "health" }]
  },
  "rules": []
}

COORDINATE RULES:
- ALL coordinates are normalized 0.0-1.0 (fraction of image width/height)
- bounds_normalized: x,y is the top-left corner; w,h is width/height of bounding box
- Platform "h" (height) should be THIN: 0.02-0.06 — represents the TOP EDGE of surfaces
- Use the image as reference: estimate w=1280, h=720 if unsure

OBJECT RULES:
- Max 25 objects total
- Max 12 platforms, 8 obstacles, 10 collectibles, 8 hazards
- Identify flat horizontal surfaces (tables, shelves, desks, floors, ledges) as platforms
- Small items (cups, bottles, pens, food) → collectible
- Dangerous items (sharp edges, electronics with cords, hot items) → hazard
- Blocking items (chairs, boxes, bags) → obstacle
- If fewer than 3 platform candidates found, INVENT reasonable ones based on what you see
- Each object needs a unique "id" like "plat_1", "obs_1", "col_1", "haz_1"

CATEGORY & ENEMY ANCHORS:
- Set category to: "plant" (plants/flowers/trees), "electric" (laptops/monitors/lamps/chargers), "food" (food/drinks), "furniture" (tables/chairs/shelves), "other" (anything else)
- Set enemy_spawn_anchor: true for category "plant" or "electric"

SPAWN RULES:
- Player spawn: bottom-left area (x: 0.05-0.15, y: 0.75-0.90)
- Exit: top-right area (x: 0.80-0.95, y: 0.10-0.25)
- Max 2 enemies, type "walker", placed ON platforms
- 3-8 pickups (mix of "coin" and "health"), placed ON or near platforms
- Place pickups and enemies slightly ABOVE platforms (lower y value by ~0.05-0.10)

CRITICAL: Return ONLY the JSON object. No markdown fences, no explanation, no extra text.`;

function parseMultipart(req: VercelRequest): Promise<{ buffer: Buffer; mimetype: string }> {
    return new Promise((resolve, reject) => {
        const form = formidable({
            maxFileSize: 10 * 1024 * 1024,
            filter: (part) => part.mimetype?.startsWith('image/') ?? false,
        });

        form.parse(req, (err, _fields, files) => {
            if (err) return reject(err);

            const uploaded = files.image;
            if (!uploaded) return reject(new Error('No image field'));

            const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
            if (!file) return reject(new Error('No image file'));

            const buffer = readFileSync(file.filepath);
            resolve({ buffer, mimetype: file.mimetype || 'image/jpeg' });
        });
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only accept POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const requestId = (req.headers['x-request-id'] as string) || 'no-request-id';
    const timestamp = new Date().toISOString();

    try {
        const { buffer, mimetype } = await parseMultipart(req);
        console.log(`[${timestamp}] request=${requestId} image size=${buffer.length} type=${mimetype}`);

        const base64Image = buffer.toString('base64');
        const dataUrl = `data:${mimetype};base64,${base64Image}`;

        console.log(`[${timestamp}] request=${requestId} sending to OpenAI GPT-4o...`);

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 2000,
            temperature: 0.3,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Analyze this photo and return the Scene JSON for a 2D platformer level. Identify all objects, surfaces, and items visible.',
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: dataUrl,
                                detail: 'low',
                            },
                        },
                    ],
                },
            ],
        });

        const raw = completion.choices?.[0]?.message?.content;
        if (!raw) {
            console.error(`[${timestamp}] request=${requestId} empty AI response`);
            return res.status(502).json({ error: 'Empty response from AI' });
        }

        console.log(`[${timestamp}] request=${requestId} AI responded, length=${raw.length}`);

        // Strip markdown fences if present
        let cleaned = raw.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '');
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error(`[${timestamp}] request=${requestId} JSON parse error:`, parseErr);
            return res.status(502).json({
                error: 'AI returned invalid JSON',
                details: parseErr instanceof Error ? parseErr.message : 'Unknown parse error',
                raw: raw.substring(0, 500),
            });
        }

        console.log(`[${timestamp}] request=${requestId} response sent status=200`);
        return res.status(200).json(parsed);

    } catch (err: unknown) {
        const apiErr = err as { status?: number; message?: string };
        console.error(`[${timestamp}] request=${requestId} error:`, apiErr.message || err);

        if (apiErr.status === 429) {
            return res.status(429).json({ error: 'Rate limited by AI provider. Try again shortly.' });
        }

        return res.status(500).json({
            error: 'AI processing failed',
            details: apiErr.message || 'Unknown error',
        });
    }
}
