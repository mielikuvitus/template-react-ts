/**
 * SCENE V1 ZOD SCHEMA
 * ====================
 *
 * Validates the Scene JSON returned by the backend AI proxy.
 *
 * WHY RUNTIME VALIDATION?
 * The backend/AI pipeline is an untrusted input source. Models can hallucinate
 * fields, return wrong types, or omit required data. Zod catches these
 * problems *before* Phaser tries to render, giving the user a clear error
 * instead of a cryptic crash.
 *
 * SCHEMA SOURCE OF TRUTH:
 * All coordinates are **normalized** (0..1 range). The frontend converts
 * them to world-pixel coords using src/game/utils/coords.ts.
 *
 * HARD CAPS (to prevent the AI from flooding the scene):
 * - Total objects: max 25
 * - Platforms: max 12
 * - Obstacles: max 8
 * - Collectibles: max 10
 * - Hazards: max 8
 */

import { z } from 'zod';

// --- Sub-schemas ---

/** Normalized bounding box (all values 0..1) */
const BoundsNormalizedSchema = z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    w: z.number().min(0).max(1),
    h: z.number().min(0).max(1),
});

/** Allowed object types */
const ObjectTypeEnum = z.enum([
    'platform',
    'obstacle',
    'collectible',
    'hazard',
    'decoration',
]);

/** Single detected/generated object */
const SceneObjectSchema = z.object({
    id: z.string().min(1),
    type: ObjectTypeEnum,
    label: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
    bounds_normalized: BoundsNormalizedSchema,
    surface_type: z.enum(['solid', 'bouncy', 'slippery', 'breakable']).optional(),
});

/** Normalized point {x, y} in 0..1 */
const NormalizedPointSchema = z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
});

/** Spawn locations */
const SpawnsSchema = z.object({
    player: NormalizedPointSchema,
    exit: NormalizedPointSchema,
    enemies: z.array(
        NormalizedPointSchema.extend({ type: z.string().optional() })
    ).default([]),
    pickups: z.array(
        NormalizedPointSchema.extend({ type: z.string().optional() })
    ).default([]),
});

/** Image dimensions from backend */
const ImageDimsSchema = z.object({
    w: z.number().int().positive(),
    h: z.number().int().positive(),
});

// --- Top-level schema ---

export const SceneV1Schema = z.object({
    version: z.literal(1),
    image: ImageDimsSchema,
    objects: z.array(SceneObjectSchema).max(25).default([]),
    spawns: SpawnsSchema,
    rules: z.array(z.unknown()).default([]),
});

// --- Per-type cap validation ---

interface CapResult {
    ok: boolean;
    errors: string[];
}

const TYPE_CAPS: Record<string, number> = {
    platform: 12,
    obstacle: 8,
    collectible: 10,
    hazard: 8,
};

/**
 * Validate per-type hard caps on objects.
 * Call this AFTER Zod parse succeeds.
 */
export function validateCaps(
    objects: { type: string }[]
): CapResult {
    const counts: Record<string, number> = {};
    for (const obj of objects) {
        counts[obj.type] = (counts[obj.type] || 0) + 1;
    }

    const errors: string[] = [];
    for (const [type, cap] of Object.entries(TYPE_CAPS)) {
        const count = counts[type] || 0;
        if (count > cap) {
            errors.push(`Too many ${type} objects: ${count} (max ${cap})`);
        }
    }

    return { ok: errors.length === 0, errors };
}

// --- Main parse function ---

interface ParseSuccess {
    ok: true;
    data: z.output<typeof SceneV1Schema>;
}

interface ParseFailure {
    ok: false;
    errors: string[];
}

/**
 * Parse and validate Scene JSON from the backend.
 *
 * This is the single entry-point the app should use. It:
 * 1. Validates structure with Zod
 * 2. Checks per-type caps
 * 3. Returns a discriminated union for easy handling
 *
 * Usage:
 *   const result = parseSceneV1(jsonFromBackend);
 *   if (!result.ok) { showErrors(result.errors); return; }
 *   const scene = result.data; // fully typed SceneV1
 */
export function parseSceneV1(input: unknown): ParseSuccess | ParseFailure {
    const zodResult = SceneV1Schema.safeParse(input);

    if (!zodResult.success) {
        const errors = zodResult.error.issues.map(
            (issue) => `${issue.path.join('.')}: ${issue.message}`
        );
        console.error('[SceneV1] Validation failed:', errors);
        return { ok: false, errors };
    }

    const data = zodResult.data;
    const capResult = validateCaps(data.objects);
    if (!capResult.ok) {
        console.error('[SceneV1] Cap validation failed:', capResult.errors);
        return { ok: false, errors: capResult.errors };
    }

    console.info(
        '[SceneV1] Validation OK:',
        `objects=${data.objects.length}`,
        `enemies=${data.spawns.enemies.length}`,
        `pickups=${data.spawns.pickups.length}`
    );

    return { ok: true, data };
}
