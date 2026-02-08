/**
 * PLATFORM FACTORY
 * =================
 *
 * Creates static Arcade Physics bodies from validated SceneV1 objects
 * where type === 'platform'.
 *
 * Each platform is a Zone with a static physics body (invisible collider)
 * plus a row of Lucide icon tiles for the visual.
 *
 * VISUAL LAYOUT:
 *   All tiles use a fixed size (BOX_SIZE_RATIO × worldH), so every box
 *   across every platform looks identical. The number of tiles is
 *   determined by how many fixed-size boxes fit the platform width,
 *   with a minimum of MIN_TILES to ensure jumpability.
 *
 *   Each surface type maps to a different Lucide icon via game_icons.ts:
 *     solid     → SquareSquare     (green)
 *     soft      → SquareArrowDown  (purple)
 *     bouncy    → SquareActivity   (yellow)
 *     slippery  → SquareCode       (blue)
 *     breakable → SquareX          (red)
 *
 *   Tiles are stored on the zone via zone.setData('tiles', [...]).
 *
 * Minimum dimensions come from ComputedPhysics (world-relative).
 */

import type { SceneObject } from '../../shared/schema/scene_v1.types';
import { normRectToWorldRect } from '../utils/coords';
import type { ComputedPhysics } from '../physics/PhysicsConfig';
import type { GameIconKey } from '../assets/game_icons';
import { ensureIconTexture, getIconTextureKey } from '../assets/IconTextureFactory';

/** Fixed box size as a fraction of world height (square tiles). */
const BOX_SIZE_RATIO = 0.05;

/** Minimum number of tiles per platform. */
const MIN_TILES = 5;

/** Map surface type string → GameIconKey for platform icons */
const SURFACE_ICON: Record<string, GameIconKey> = {
    solid:     'platform_solid',
    bouncy:    'platform_bouncy',
    slippery:  'platform_slippery',
    breakable: 'platform_breakable',
    soft:      'platform_soft',
};

const DEFAULT_ICON: GameIconKey = 'platform_solid';

/** Texture size for platform tile icons (px). Scaled to actual tile dimensions. */
const ICON_RENDER_SIZE = 64;

export function createPlatforms(
    scene: Phaser.Scene,
    objects: SceneObject[],
    worldW: number,
    worldH: number,
    phys: ComputedPhysics,
): Phaser.Physics.Arcade.StaticGroup {
    const group = scene.physics.add.staticGroup();

    const platforms = objects.filter(o => o.type === 'platform');

    // Fixed tile size in pixels (same for every platform)
    const boxSize = Math.round(worldH * BOX_SIZE_RATIO);

    for (const obj of platforms) {
        const rect = normRectToWorldRect(obj.bounds_normalized, worldW, worldH);

        // Skip tiny platforms that would be unplayable
        if (rect.w < phys.minPlatformWidth || rect.h < phys.minPlatformHeight) {
            continue;
        }

        const surfaceType = obj.surface_type ?? 'solid';

        // Resolve the Lucide icon for this surface type
        const iconKey = SURFACE_ICON[surfaceType] ?? DEFAULT_ICON;
        ensureIconTexture(scene, iconKey, ICON_RENDER_SIZE);
        const textureKey = getIconTextureKey(iconKey, ICON_RENDER_SIZE);

        // --- Tile count: fit as many fixed-size boxes as possible, min 5 ---
        const fittedCount = Math.max(1, Math.round(rect.w / boxSize));
        const tileCount = Math.max(MIN_TILES, fittedCount);

        // Platform width = tiles × boxSize (may be wider than original rect)
        const platformW = tileCount * boxSize;

        // Center the platform on the original rect center
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const leftEdge = cx - platformW / 2;

        const tiles: Phaser.GameObjects.Image[] = [];

        for (let i = 0; i < tileCount; i++) {
            const boxCx = leftEdge + boxSize * i + boxSize / 2;
            const tile = scene.add.image(boxCx, cy, textureKey)
                .setDisplaySize(boxSize, boxSize)
                .setAlpha(0.7);
            tiles.push(tile);
        }

        // --- Physics: zone matches the visual tile row ---
        const zone = scene.add.zone(cx, cy, platformW, boxSize);
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
