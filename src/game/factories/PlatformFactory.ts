/**
 * PLATFORM FACTORY
 * =================
 *
 * Creates static Arcade Physics bodies from validated SceneV1 objects
 * where type === 'platform'.
 *
 * Each platform is a Zone with a static physics body (invisible collider)
 * plus a row of individual box tiles for the visual.
 *
 * VISUAL LAYOUT:
 *   Each platform is tiled with square boxes (width = platform height).
 *   The platform width is divided into the closest number of full boxes
 *   that fit, then each box is slightly stretched/compressed to fill
 *   the platform edge-to-edge with no gaps.
 *
 *   Tiles are stored on the zone via zone.setData('tiles', [...])
 *   so they can be swapped for custom sprites later.
 *
 * Surface types get distinct colors:
 *   - solid (default): green
 *   - soft: purple — reduces player speed
 *
 * Minimum dimensions come from ComputedPhysics (world-relative).
 */

import type { SceneObject } from '../../shared/schema/scene_v1.types';
import { normRectToWorldRect } from '../utils/coords';
import type { ComputedPhysics } from '../physics/PhysicsConfig';

/** Color config per surface type */
const SURFACE_COLORS: Record<string, { fill: number; stroke: number }> = {
    solid:     { fill: 0x4ade80, stroke: 0x4ade80 },
    bouncy:    { fill: 0xfbbf24, stroke: 0xfbbf24 },
    slippery:  { fill: 0x38bdf8, stroke: 0x38bdf8 },
    breakable: { fill: 0xf87171, stroke: 0xf87171 },
    soft:      { fill: 0xc084fc, stroke: 0xc084fc },
};

const DEFAULT_COLORS = SURFACE_COLORS.solid;

export function createPlatforms(
    scene: Phaser.Scene,
    objects: SceneObject[],
    worldW: number,
    worldH: number,
    phys: ComputedPhysics,
): Phaser.Physics.Arcade.StaticGroup {
    const group = scene.physics.add.staticGroup();

    const platforms = objects.filter(o => o.type === 'platform');

    for (const obj of platforms) {
        const rect = normRectToWorldRect(obj.bounds_normalized, worldW, worldH);

        // Skip tiny platforms that would be unplayable
        if (rect.w < phys.minPlatformWidth || rect.h < phys.minPlatformHeight) {
            continue;
        }

        // Use the full height from the scene data (no cap)
        const h = rect.h;

        const cx = rect.x + rect.w / 2;
        const cy = rect.y + h / 2;

        const surfaceType = obj.surface_type ?? 'solid';
        const colors = SURFACE_COLORS[surfaceType] ?? DEFAULT_COLORS;

        // --- Visual: fit square tiles (width = height), stretch slightly to fill ---
        const tileCount = Math.max(1, Math.round(rect.w / h));
        const boxW = rect.w / tileCount;
        const leftEdge = rect.x; // left edge of the platform in world coords
        const tiles: Phaser.GameObjects.Rectangle[] = [];

        for (let i = 0; i < tileCount; i++) {
            const boxCx = leftEdge + boxW * i + boxW / 2;
            const tile = scene.add.rectangle(boxCx, cy, boxW, h, colors.fill, 0.25)
                .setStrokeStyle(1, colors.stroke, 0.5);
            tiles.push(tile);
        }

        // --- Physics: single zone spanning the full platform width ---
        const zone = scene.add.zone(cx, cy, rect.w, h);
        scene.physics.add.existing(zone, true); // true = static body

        // Store surface type so GameScene can read it during collisions
        zone.setData('surfaceType', surfaceType);

        // Store tiles for future sprite swaps
        zone.setData('tiles', tiles);

        group.add(zone);
    }

    console.info(`[PlatformFactory] Created ${group.getLength()} platforms from ${platforms.length} objects`);

    return group;
}
