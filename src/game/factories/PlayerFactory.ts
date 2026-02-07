/**
 * PLAYER FACTORY
 * ===============
 *
 * Creates the player sprite with Arcade Physics body.
 * All sizes are derived from ComputedPhysics (world-relative).
 */

import type { ComputedPhysics } from '../physics/PhysicsConfig';
import { ensureIconTexture, getIconTextureKey } from '../assets/IconTextureFactory';

export function createPlayer(
    scene: Phaser.Scene,
    x: number,
    y: number,
    phys: ComputedPhysics,
): Phaser.Physics.Arcade.Sprite {
    const size = phys.playerSizePx;
    ensureIconTexture(scene, 'player', size, '#22d3ee');
    const key = getIconTextureKey('player', size);

    const sprite = scene.physics.add.sprite(x, y, key);
    sprite.setCollideWorldBounds(true);

    // Tighten the physics body to the icon's visible area
    sprite.body!.setSize(phys.playerBodyWidth, phys.playerBodyHeight);
    sprite.body!.setOffset(
        (size - phys.playerBodyWidth) / 2,
        (size - phys.playerBodyHeight) / 2,
    );

    return sprite;
}
