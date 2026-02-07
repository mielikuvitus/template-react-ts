/**
 * PICKUP FACTORY
 * ===============
 *
 * Creates collectible pickup sprites from scene spawns.
 * Size derived from ComputedPhysics (world-relative).
 */

import type { ComputedPhysics } from '../physics/PhysicsConfig';
import { ensureIconTexture, getIconTextureKey } from '../assets/IconTextureFactory';

export interface PickupSprite extends Phaser.Physics.Arcade.Sprite {
    pickupType: string;
}

export function createPickups(
    scene: Phaser.Scene,
    pickups: Array<{ x: number; y: number; type?: string }>,
    worldW: number,
    worldH: number,
    phys: ComputedPhysics,
): Phaser.Physics.Arcade.Group {
    const group = scene.physics.add.group({ allowGravity: false, immovable: true });

    const size = phys.pickupSizePx;

    // Ensure textures
    ensureIconTexture(scene, 'coin', size, '#fbbf24');
    ensureIconTexture(scene, 'health', size, '#ef4444');

    for (const p of pickups) {
        const iconName = p.type === 'health' ? 'health' : 'coin';
        const key = getIconTextureKey(iconName, size);

        const px = p.x * worldW;
        const py = p.y * worldH;

        const sprite = scene.physics.add.sprite(px, py, key) as PickupSprite;
        sprite.pickupType = p.type ?? 'coin';
        const body = sprite.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setImmovable(true);

        group.add(sprite);
    }

    return group;
}
