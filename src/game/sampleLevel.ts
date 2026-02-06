import { LevelData } from './types';

/**
 * Sample level matching the JSON schema.
 * Replace this with data from the OpenAI API at runtime.
 */
export const SAMPLE_LEVEL: LevelData = {
    image: { w: 1280, h: 720 },
    detections: [],
    spawns: {
        player: { x: 0.10, y: 0.80 },
        exit:   { x: 0.90, y: 0.80 },
        enemies: [],
        pickups: []
    },
    surfaces: [
        // Ground
        { type: "platform", poly: [[0.0, 0.85], [1.0, 0.85], [1.0, 0.90], [0.0, 0.90]] },
    ],
    rules: []
};
