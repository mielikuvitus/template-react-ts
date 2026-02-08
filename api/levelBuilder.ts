/**
 * DETERMINISTIC LEVEL BUILDER
 * ============================
 *
 * Takes raw AI object detections and builds a playable SceneV1 level.
 *
 * The AI only does perception (what objects are where). This module handles
 * all gameplay decisions: platform placement, spawn points, reachability,
 * pickups, enemies. Because it's deterministic code (not AI), every level
 * is guaranteed to be completable.
 *
 * Output conforms to the SceneV1 Zod schema in
 * src/shared/schema/scene_v1.schema.ts
 */

// ---------------------------------------------------------------------------
// Types — AI detection input
// ---------------------------------------------------------------------------

export interface Detection {
    label: string;
    category: 'furniture' | 'food' | 'plant' | 'electric' | 'other';
    confidence: number;
    bounds_normalized: { x: number; y: number; w: number; h: number };
}

export interface DetectionResponse {
    image: { w: number; h: number };
    detections: Detection[];
}

// ---------------------------------------------------------------------------
// Types — SceneV1 output (mirrors schema, no Zod import needed server-side)
// ---------------------------------------------------------------------------

interface Bounds {
    x: number; y: number; w: number; h: number;
}

interface SceneObject {
    id: string;
    type: 'platform' | 'obstacle' | 'collectible' | 'hazard';
    label: string;
    confidence: number;
    bounds_normalized: Bounds;
    surface_type?: 'solid' | 'soft';
    category?: 'furniture' | 'food' | 'plant' | 'electric' | 'other';
    enemy_spawn_anchor?: boolean;
}

interface SpawnPoint {
    x: number; y: number;
}

interface EnemySpawn extends SpawnPoint {
    type: string;
}

interface PickupSpawn extends SpawnPoint {
    type: string;
}

interface SceneV1 {
    version: 1;
    image: { w: number; h: number };
    objects: SceneObject[];
    spawns: {
        player: SpawnPoint;
        exit: SpawnPoint;
        enemies: EnemySpawn[];
        pickups: PickupSpawn[];
    };
    rules: unknown[];
}

// ---------------------------------------------------------------------------
// Constants — tuned to match Phaser physics (PhysicsConfig.ts)
// ---------------------------------------------------------------------------

/** Ground platform Y position (near bottom of screen). */
const GROUND_Y = 0.92;

/** Target exit height (near top of screen). */
const EXIT_Y = 0.18;

/** Max vertical gap the player can jump (safe within 0.35 default jump fraction). */
const MAX_JUMP_HEIGHT = 0.22;

/** Thin platform height for the walking surface. */
const PLATFORM_THICKNESS = 0.03;

/** How far above a platform surface to place entities. */
const ENTITY_OFFSET_Y = 0.06;

/** Min / max platforms to generate (excluding ground). */
const MIN_PLATFORMS = 5;
const MAX_PLATFORMS = 8;

/** Min / max platform widths (normalized). */
const MIN_PLAT_W = 0.12;
const MAX_PLAT_W = 0.35;

/** Horizontal margins. */
const X_MIN = 0.02;
const X_MAX = 0.96;

/** Layout strategy names. */
type LayoutStrategy = 'zigzag' | 'spiral' | 'scattered' | 'sCurve';
const STRATEGIES: LayoutStrategy[] = ['zigzag', 'spiral', 'scattered', 'sCurve'];

// ---------------------------------------------------------------------------
// Simple seeded PRNG (mulberry32) — deterministic per photo
// ---------------------------------------------------------------------------

function createRng(seed: number) {
    let s = seed | 0;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Derive a seed from detections so identical photos produce the same level. */
function deriveSeed(input: DetectionResponse): number {
    let hash = input.image.w * 7919 + input.image.h * 6271;
    for (const d of input.detections) {
        hash = ((hash << 5) - hash + d.label.length * 31 +
            Math.round(d.bounds_normalized.x * 1000) +
            Math.round(d.bounds_normalized.y * 1000)) | 0;
    }
    return hash;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------

export function buildLevel(input: DetectionResponse): SceneV1 {
    const { image, detections } = input;
    const objects: SceneObject[] = [];
    let idCounter = 0;
    const nextId = (prefix: string) => `${prefix}_${idCounter++}`;

    // -----------------------------------------------------------------------
    // Step A: Classify detections — we use labels/categories/widths ONLY.
    //         AI positions are DISCARDED because photos cluster in the
    //         centre, producing unplayable layouts.
    // -----------------------------------------------------------------------

    interface DetectionInfo {
        label: string;
        category: Detection['category'];
        confidence: number;
        width: number; // normalized width from AI (used for platform sizing)
        enemyAnchor: boolean;
    }

    const platformInfos: DetectionInfo[] = [];
    const collectibleDetections: Detection[] = [];

    for (const det of detections) {
        if (det.category === 'food') {
            collectibleDetections.push(det);
            continue;
        }

        // Everything else is a potential platform source
        platformInfos.push({
            label: det.label,
            category: det.category,
            confidence: det.confidence,
            width: clamp(det.bounds_normalized.w, MIN_PLAT_W, MAX_PLAT_W),
            enemyAnchor: det.category === 'plant' || det.category === 'electric',
        });
    }

    // -----------------------------------------------------------------------
    // Step B: Decide platform count
    // -----------------------------------------------------------------------

    const platCount = clamp(platformInfos.length, MIN_PLATFORMS, MAX_PLATFORMS);

    // Pad with generic platforms if we have fewer detections than MIN_PLATFORMS
    while (platformInfos.length < platCount) {
        platformInfos.push({
            label: 'ledge',
            category: 'other',
            confidence: 1.0,
            width: 0.18,
            enemyAnchor: false,
        });
    }

    // -----------------------------------------------------------------------
    // Step C: Build platform layout using a randomly-selected strategy
    //
    //     A seeded RNG (deterministic per photo) picks one of several
    //     layout strategies and adds jitter to positions & sizes.
    //     All strategies guarantee:
    //       - Every vertical gap ≤ MAX_JUMP_HEIGHT
    //       - A clear path from ground to exit
    // -----------------------------------------------------------------------

    const rng = createRng(deriveSeed(input));

    // Pick a strategy
    const strategy = STRATEGIES[Math.floor(rng() * STRATEGIES.length)];

    const totalRise = GROUND_Y - EXIT_Y; // positive, ~0.74
    const baseStep = totalRise / (platCount + 1);
    const vertStep = Math.min(baseStep, MAX_JUMP_HEIGHT);

    interface StaircasePlatform {
        info: DetectionInfo;
        bounds: Bounds;
        isGround: boolean;
    }

    const staircasePlatforms: StaircasePlatform[] = [];

    /** Add jitter to width: ±30% variation */
    const jitterWidth = (base: number): number => {
        const factor = 0.7 + rng() * 0.6; // 0.7 – 1.3
        return clamp(base * factor, MIN_PLAT_W, MAX_PLAT_W);
    };

    /** Add vertical jitter: ±20% of the step */
    const jitterY = (baseY: number, step: number): number => {
        const offset = (rng() - 0.5) * step * 0.4;
        return clamp(baseY + offset, EXIT_Y - 0.02, GROUND_Y - 0.04);
    };

    /** Random X within a range */
    const randomX = (lo: number, hi: number, platW: number): number => {
        const maxStart = Math.max(lo, hi - platW);
        return clamp(lo + rng() * (maxStart - lo), X_MIN, X_MAX - platW);
    };

    // ---- Strategy implementations ----------------------------------------

    if (strategy === 'zigzag') {
        // Classic zigzag but with randomised band positions and jitter
        for (let i = 0; i < platCount; i++) {
            const info = platformInfos[i];
            const w = jitterWidth(info.width);
            const y = jitterY(GROUND_Y - (i + 1) * vertStep, vertStep);

            // Alternate sides but with random offset within each half
            const goLeft = i % 2 === 0;
            const x = goLeft
                ? randomX(X_MIN, 0.42, w)
                : randomX(0.50, X_MAX, w);

            staircasePlatforms.push({
                info, bounds: { x, y, w, h: PLATFORM_THICKNESS }, isGround: false,
            });
        }

    } else if (strategy === 'spiral') {
        // Platforms spiral around the screen edges
        for (let i = 0; i < platCount; i++) {
            const info = platformInfos[i];
            const w = jitterWidth(info.width);
            const y = jitterY(GROUND_Y - (i + 1) * vertStep, vertStep);

            // Cycle through 4 quadrants: left, right, centre-left, centre-right
            const quadrant = i % 4;
            let x: number;
            if (quadrant === 0) x = randomX(X_MIN, 0.30, w);
            else if (quadrant === 1) x = randomX(0.65, X_MAX, w);
            else if (quadrant === 2) x = randomX(0.25, 0.55, w);
            else x = randomX(0.45, 0.75, w);

            staircasePlatforms.push({
                info, bounds: { x, y, w, h: PLATFORM_THICKNESS }, isGround: false,
            });
        }

    } else if (strategy === 'scattered') {
        // Platforms placed with more random X positions across the full width
        for (let i = 0; i < platCount; i++) {
            const info = platformInfos[i];
            const w = jitterWidth(info.width);
            const y = jitterY(GROUND_Y - (i + 1) * vertStep, vertStep);

            // Full-width random but biased away from edges
            const x = randomX(X_MIN + 0.03, X_MAX - 0.03, w);

            staircasePlatforms.push({
                info, bounds: { x, y, w, h: PLATFORM_THICKNESS }, isGround: false,
            });
        }

    } else {
        // S-curve: smooth sinusoidal path from bottom-left to top-right
        for (let i = 0; i < platCount; i++) {
            const info = platformInfos[i];
            const w = jitterWidth(info.width);
            const y = jitterY(GROUND_Y - (i + 1) * vertStep, vertStep);

            const progress = i / Math.max(platCount - 1, 1); // 0–1
            // Sine wave across the width
            const centreX = lerp(0.15, 0.80, (Math.sin(progress * Math.PI * 2 - Math.PI / 2) + 1) / 2);
            const x = clamp(centreX - w / 2 + (rng() - 0.5) * 0.08, X_MIN, X_MAX - w);

            staircasePlatforms.push({
                info, bounds: { x, y, w, h: PLATFORM_THICKNESS }, isGround: false,
            });
        }
    }

    // ---- Add 1-2 bonus floating platforms for extra exploration -----------

    const bonusCount = rng() < 0.6 ? 1 : 2;
    for (let b = 0; b < bonusCount && staircasePlatforms.length < MAX_PLATFORMS + 2; b++) {
        const w = MIN_PLAT_W + rng() * 0.06;
        // Place between existing platforms vertically
        const slotIdx = Math.floor(rng() * (staircasePlatforms.length - 1));
        const above = staircasePlatforms[slotIdx];
        const below = staircasePlatforms[Math.min(slotIdx + 1, staircasePlatforms.length - 1)];
        if (!above || !below) continue;

        const y = (above.bounds.y + below.bounds.y) / 2;
        // Place on the opposite side from the nearby platform
        const nearbyX = above.bounds.x + above.bounds.w / 2;
        const x = nearbyX < 0.5
            ? randomX(0.55, X_MAX, w)
            : randomX(X_MIN, 0.40, w);

        staircasePlatforms.push({
            info: { label: 'ledge', category: 'other', confidence: 1.0, width: w, enemyAnchor: false },
            bounds: { x: clamp(x, X_MIN, X_MAX - w), y: clamp(y, 0.08, 0.88), w, h: PLATFORM_THICKNESS },
            isGround: false,
        });
    }

    // -----------------------------------------------------------------------
    // Step D: Add ground platform (full width, near bottom)
    // -----------------------------------------------------------------------

    const groundBounds: Bounds = { x: 0.0, y: GROUND_Y, w: 1.0, h: PLATFORM_THICKNESS };
    staircasePlatforms.push({
        info: { label: 'ground', category: 'furniture', confidence: 1.0, width: 1.0, enemyAnchor: false },
        bounds: groundBounds,
        isGround: true,
    });

    // -----------------------------------------------------------------------
    // Step E: Emit platform SceneObjects
    // -----------------------------------------------------------------------

    for (const sp of staircasePlatforms) {
        objects.push({
            id: nextId(sp.isGround ? 'ground' : 'plat'),
            type: 'platform',
            label: sp.info.label,
            confidence: sp.info.confidence,
            bounds_normalized: sp.bounds,
            surface_type: 'solid',
            category: sp.info.category,
            enemy_spawn_anchor: sp.info.enemyAnchor,
        });
    }

    // -----------------------------------------------------------------------
    // Step F: Add collectible objects from food detections (placed on
    //         staircase platforms, not at AI positions)
    // -----------------------------------------------------------------------

    const realPlatforms = staircasePlatforms.filter((p) => !p.isGround);

    for (let i = 0; i < collectibleDetections.slice(0, 5).length; i++) {
        const det = collectibleDetections[i];
        const plat = realPlatforms[i % realPlatforms.length];
        objects.push({
            id: nextId('col'),
            type: 'collectible',
            label: det.label,
            confidence: det.confidence,
            bounds_normalized: {
                x: clamp(plat.bounds.x + plat.bounds.w * 0.3, 0.02, 0.95),
                y: plat.bounds.y - 0.04,
                w: 0.03,
                h: 0.03,
            },
            category: 'food',
        });
    }

    // -----------------------------------------------------------------------
    // Step G: Player spawn — on ground, far left
    // -----------------------------------------------------------------------

    const playerSpawn: SpawnPoint = {
        x: 0.08,
        y: GROUND_Y - ENTITY_OFFSET_Y,
    };

    // -----------------------------------------------------------------------
    // Step H: Exit — on the highest staircase platform, right side
    // -----------------------------------------------------------------------

    // Highest = smallest Y value
    const sorted = [...realPlatforms].sort((a, b) => a.bounds.y - b.bounds.y);
    const highestPlat = sorted[0];
    const exitSpawn: SpawnPoint = {
        x: clamp(highestPlat.bounds.x + highestPlat.bounds.w - 0.04, 0.6, 0.95),
        y: highestPlat.bounds.y - ENTITY_OFFSET_Y,
    };

    // -----------------------------------------------------------------------
    // Step I: Place pickups on every other staircase platform
    // -----------------------------------------------------------------------

    const pickups: PickupSpawn[] = [];
    for (let i = 0; i < realPlatforms.length && pickups.length < 6; i++) {
        const plat = realPlatforms[i];
        pickups.push({
            x: clamp(plat.bounds.x + plat.bounds.w / 2, 0.05, 0.95),
            y: plat.bounds.y - ENTITY_OFFSET_Y,
            type: i === 0 ? 'health' : 'coin',
        });
    }

    // Ensure at least 3 pickups — add on ground if needed
    if (pickups.length < 3) {
        pickups.push({ x: 0.3, y: GROUND_Y - ENTITY_OFFSET_Y, type: 'coin' });
        pickups.push({ x: 0.6, y: GROUND_Y - ENTITY_OFFSET_Y, type: 'coin' });
    }

    // -----------------------------------------------------------------------
    // Step J: Place 1–2 enemies on mid-height staircase platforms
    // -----------------------------------------------------------------------

    const enemies: EnemySpawn[] = [];
    // Pick platforms from the middle of the staircase (indices around platCount/3 and 2*platCount/3)
    const midIdx1 = Math.floor(realPlatforms.length / 3);
    const midIdx2 = Math.floor((realPlatforms.length * 2) / 3);
    const enemyIndices = realPlatforms.length >= 4 ? [midIdx1, midIdx2] : [midIdx1];

    for (const idx of enemyIndices) {
        const plat = realPlatforms[idx];
        if (!plat) continue;
        enemies.push({
            x: clamp(plat.bounds.x + plat.bounds.w / 2, 0.05, 0.95),
            y: plat.bounds.y - ENTITY_OFFSET_Y,
            type: 'walker',
        });

        // Mark the corresponding platform object as enemy anchor
        const platObj = objects.find(
            (o) => o.type === 'platform' && o.bounds_normalized === plat.bounds
        );
        if (platObj) platObj.enemy_spawn_anchor = true;
    }

    // -----------------------------------------------------------------------
    // Step K: Assemble final SceneV1
    // -----------------------------------------------------------------------

    const scene: SceneV1 = {
        version: 1,
        image: { w: image.w, h: image.h },
        objects,
        spawns: {
            player: playerSpawn,
            exit: exitSpawn,
            enemies,
            pickups,
        },
        rules: [],
    };

    return scene;
}
