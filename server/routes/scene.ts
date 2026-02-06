import { Router, Request, Response } from 'express';
import multer from 'multer';

// Configure multer to store files in memory (no disk storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    fileFilter: (_req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
});

export const sceneRouter = Router();

/**
 * POST /api/scene
 * Accepts multipart/form-data with an "image" field
 * Returns hardcoded Scene JSON (v1 schema)
 */
sceneRouter.post('/', upload.single('image'), (req: Request, res: Response) => {
    const file = req.file;
    const requestId = req.headers['x-request-id'] || 'no-request-id';
    const timestamp = new Date().toISOString();

    if (!file) {
        console.log(`[${timestamp}] request=${requestId} error=no_image`);
        res.status(400).json({
            error: 'No image file provided',
            hint: 'Send a multipart/form-data request with field name "image"',
        });
        return;
    }

    // Log received image info with request ID for tracing
    console.log(`[${timestamp}] request=${requestId} received image size=${file.size} type=${file.mimetype}`);

    // Return hardcoded Scene JSON matching SceneV1 schema
    const sceneResponse = {
        version: 1,
        image: {
            w: 1024,
            h: 768,
        },
        detections: [],
        spawns: {
            player: { x: 0.1, y: 0.85 },
            exit: { x: 0.9, y: 0.2 },
            enemies: [],
            pickups: [],
        },
        surfaces: [],
        rules: [],
    };

    console.log(`[${timestamp}] request=${requestId} response sent status=200`);
    res.json(sceneResponse);
});

// Error handling middleware for multer errors
sceneRouter.use((err: Error, _req: Request, res: Response, _next: Function) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
            return;
        }
        res.status(400).json({ error: err.message });
        return;
    }
    
    if (err.message === 'Only image files are allowed') {
        res.status(415).json({ error: err.message });
        return;
    }

    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
