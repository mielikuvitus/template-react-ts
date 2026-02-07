/**
 * COORDINATE CONVERSION UTILITIES
 * ================================
 *
 * The backend returns all positions and bounding boxes in **normalized**
 * coordinates (0..1 range), where:
 *   - (0, 0) = top-left of the image
 *   - (1, 1) = bottom-right of the image
 *
 * Phaser uses **world coordinates** in pixels, so we need to convert:
 *   worldX = normalizedX * worldWidth
 *   worldY = normalizedY * worldHeight
 *
 * These functions are pure (no Phaser imports) so they can be unit-tested.
 */

import type { BoundsNormalized } from '../../shared/schema/scene_v1.types';

/** Convert normalized X (0..1) to world pixel X */
export function normToWorldX(nx: number, worldW: number): number {
    return nx * worldW;
}

/** Convert normalized Y (0..1) to world pixel Y */
export function normToWorldY(ny: number, worldH: number): number {
    return ny * worldH;
}

/** World-space rectangle */
export interface WorldRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/**
 * Convert a normalized bounding box to world-pixel rectangle.
 * Returns { x, y, w, h } in world pixels.
 */
export function normRectToWorldRect(
    bounds: BoundsNormalized,
    worldW: number,
    worldH: number
): WorldRect {
    return {
        x: bounds.x * worldW,
        y: bounds.y * worldH,
        w: bounds.w * worldW,
        h: bounds.h * worldH,
    };
}
