/**
 * AI PROXY SERVICE - Frontend API Client
 * =======================================
 * 
 * Purpose:
 * Upload captured photos to the backend for scene generation.
 * 
 * BACKEND API CONTRACT:
 * ---------------------
 * Endpoint: POST /api/scene
 * Content-Type: multipart/form-data
 * 
 * Request:
 *   - Field name: "image" (required) - the photo file/blob
 *   - Header: "x-request-id" (optional) - for request tracing
 * 
 * Response (200 OK):
 *   {
 *     "version": 1,
 *     "image": { "w": number, "h": number },
 *     "detections": [...],
 *     "spawns": {
 *       "player": { "x": number, "y": number },
 *       "exit": { "x": number, "y": number },
 *       "enemies": [...],
 *       "pickups": [...]
 *     },
 *     "surfaces": [...],
 *     "rules": [...]
 *   }
 * 
 * Error Response (4xx/5xx):
 *   { "error": "description" }
 * 
 * TESTING WITH CURL:
 * ------------------
 * curl -i -X POST "http://localhost:3001/api/scene" \
 *   -H "x-request-id: req_CURLTEST" \
 *   -F "image=@/path/to/photo.jpg"
 */

export interface UploadParams {
    blob: Blob;
    filename?: string;
    endpoint?: string;
    requestId?: string;
}

export interface SceneResponse {
    version: number;
    image: { w: number; h: number };
    detections: unknown[];
    spawns: {
        player: { x: number; y: number };
        exit: { x: number; y: number };
        enemies: unknown[];
        pickups: unknown[];
    };
    surfaces: unknown[];
    rules: unknown[];
}

export class UploadError extends Error {
    constructor(
        message: string,
        public status: number,
        public responseText: string
    ) {
        super(message);
        this.name = 'UploadError';
    }
}

/**
 * Upload an image blob to the backend and receive Scene JSON.
 * 
 * @param params.blob - The compressed image blob to upload
 * @param params.filename - Optional filename (default: "photo.jpg")
 * @param params.endpoint - Optional endpoint URL (default: dev server)
 * @param params.requestId - Optional request ID for tracing
 * @returns Promise resolving to Scene JSON
 * @throws UploadError on non-2xx response
 */
export async function uploadImageForScene(params: UploadParams): Promise<SceneResponse> {
    const {
        blob,
        filename = 'photo.jpg',
        endpoint = 'http://localhost:3001/api/scene',
        requestId,
    } = params;

    const formData = new FormData();
    formData.append('image', blob, filename);

    const headers: HeadersInit = {};
    if (requestId) {
        headers['x-request-id'] = requestId;
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: formData,
    });

    const responseText = await response.text();

    if (!response.ok) {
        throw new UploadError(
            `Upload failed: ${response.status} ${response.statusText}`,
            response.status,
            responseText
        );
    }

    try {
        return JSON.parse(responseText) as SceneResponse;
    } catch {
        throw new UploadError(
            'Invalid JSON response from server',
            response.status,
            responseText
        );
    }
}
