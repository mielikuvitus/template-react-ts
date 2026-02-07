/**
 * PLATFORM FACTORY
 * =================
 *
 * Creates static Arcade Physics bodies from validated SceneV1 objects
 * where type === 'platform'.
 *
 * Each platform is a Zone with a static physics body (invisible collider)
 * plus a visible green rectangle overlay for feedback.
 *
 * Minimum dimensions come from ComputedPhysics (world-relative).
 */

import type { SceneObject } from '../../shared/schema/scene_v1.types';
import { normRectToWorldRect } from '../utils/coords';
import type { ComputedPhysics } from '../physics/PhysicsConfig';

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

        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;

        // Visual: semi-transparent green rectangle
        scene.add.rectangle(cx, cy, rect.w, rect.h, 0x4ade80, 0.25)
            .setStrokeStyle(1, 0x4ade80, 0.5);

        // Physics: use a Zone with a static body for reliable collisions
        const zone = scene.add.zone(cx, cy, rect.w, rect.h);
        scene.physics.add.existing(zone, true); // true = static body

        group.add(zone);
    }

    console.info(`[PlatformFactory] Created ${group.getLength()} platforms from ${platforms.length} objects`);

    return group;
}
