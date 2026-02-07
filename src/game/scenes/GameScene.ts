/**
 * GAME SCENE (Step 4) — Playable Platformer
 * ==========================================
 *
 * A small playable slice: movement, collisions, win condition, pickups.
 *
 * Receives validated SceneV1 data and a photo URL via init data.
 * Same data as PreviewScene, but with Arcade Physics enabled.
 *
 * All physics values (gravity, speed, jump, sizes) are computed relative
 * to the world dimensions so the game feels identical on any device.
 *
 * Controls:
 * - Keyboard: Arrow keys / WASD + Space to jump
 * - Mobile: InputState written by React MobileControls overlay
 *
 * Win condition: player overlaps exit sprite.
 * Collectibles: overlap pickups -> score increment.
 */

import { Scene } from 'phaser';
import type { SceneV1 } from '../../shared/schema/scene_v1.types';
import { normToWorldX, normToWorldY } from '../utils/coords';
import { computePhysics, type ComputedPhysics } from '../physics/PhysicsConfig';
import { createPlayer } from '../factories/PlayerFactory';
import { createPlatforms } from '../factories/PlatformFactory';
import { createExit } from '../factories/ExitFactory';
import { createPickups, PickupSprite } from '../factories/PickupFactory';
import { EventBus } from '../EventBus';
import type { InputState } from '../input/InputState';

export interface GameSceneData {
    photoUrl: string;
    sceneData: SceneV1;
    inputState: InputState;
    debugEnabled: boolean;
}

export class GameScene extends Scene {
    private sceneData!: SceneV1;
    private photoUrl!: string;
    private inputState!: InputState;
    private debugEnabled!: boolean;

    /** Texture key for the loaded photo */
    private photoTextureKey?: string;

    private worldW = 960;
    private worldH = 640;

    /** World-relative physics values — computed once in create() */
    private phys!: ComputedPhysics;

    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
    private spaceKey!: Phaser.Input.Keyboard.Key;

    private score = 0;
    private gameWon = false;

    // Debug layer
    private debugLayer!: Phaser.GameObjects.Container;
    private debugGraphics!: Phaser.GameObjects.Graphics;

    constructor() {
        super('GameScene');
    }

    init(data: GameSceneData) {
        this.photoUrl = data.photoUrl;
        this.sceneData = data.sceneData;
        this.inputState = data.inputState;
        this.debugEnabled = data.debugEnabled ?? true;
        this.score = 0;
        this.gameWon = false;
        this.photoTextureKey = undefined;

        // World dimensions from game config (PlayScreen sets these to photo dimensions)
        this.worldW = this.scale.width || 960;
        this.worldH = this.scale.height || 640;

        // Compute physics values relative to world size + scene layout.
        // Jump height adapts to the largest vertical gap in the level.
        this.phys = computePhysics(this.worldW, this.worldH, this.sceneData);

        console.info('[GameScene] init:', {
            worldW: this.worldW,
            worldH: this.worldH,
            playerSizePx: this.phys.playerSizePx,
            gravityY: Math.round(this.phys.gravityY),
            jumpVelocity: Math.round(this.phys.jumpVelocity),
            playerSpeed: Math.round(this.phys.playerSpeed),
            objects: this.sceneData.objects.length,
        });
    }

    preload() {
        if (this.photoUrl) {
            this.photoTextureKey = 'game-photo-' + Date.now();
            this.load.image(this.photoTextureKey, this.photoUrl);
        }
    }

    create() {
        // --- Set gravity at runtime (not in config, since it depends on world size) ---
        this.physics.world.gravity.y = this.phys.gravityY;

        // --- Photo background ---
        if (this.photoTextureKey && this.textures.exists(this.photoTextureKey)) {
            const photo = this.add.image(0, 0, this.photoTextureKey).setOrigin(0, 0);
            photo.setDisplaySize(this.worldW, this.worldH);
            photo.setAlpha(0.7);
        } else {
            this.add.rectangle(
                this.worldW / 2, this.worldH / 2,
                this.worldW, this.worldH,
                0x1a1a2e,
            );
        }

        // --- World bounds ---
        this.physics.world.setBounds(0, 0, this.worldW, this.worldH);

        // --- Platforms ---
        const platformGroup = createPlatforms(
            this, this.sceneData.objects, this.worldW, this.worldH, this.phys,
        );

        // Ground at the very bottom so the player can't fall off-screen
        const ground = this.add.zone(this.worldW / 2, this.worldH - 2, this.worldW, 4);
        this.physics.add.existing(ground, true);
        platformGroup.add(ground);

        // --- Player ---
        const spawn = this.sceneData.spawns.player;
        const playerX = normToWorldX(spawn.x, this.worldW);
        const playerY = normToWorldY(spawn.y, this.worldH);
        this.player = createPlayer(this, playerX, playerY, this.phys);

        // Player <-> Platforms collision
        this.physics.add.collider(this.player, platformGroup);

        // --- Exit ---
        const exitSpawn = this.sceneData.spawns.exit;
        const exitSprite = createExit(
            this,
            normToWorldX(exitSpawn.x, this.worldW),
            normToWorldY(exitSpawn.y, this.worldH),
            this.phys,
        );

        // Player overlaps exit -> win
        this.physics.add.overlap(this.player, exitSprite, () => {
            if (!this.gameWon) {
                this.gameWon = true;
                this.handleWin();
            }
        });

        // --- Pickups ---
        if (this.sceneData.spawns.pickups.length > 0) {
            const pickupGroup = createPickups(
                this,
                this.sceneData.spawns.pickups,
                this.worldW,
                this.worldH,
                this.phys,
            );

            this.physics.add.overlap(this.player, pickupGroup, (_player, pickup) => {
                const p = pickup as PickupSprite;
                p.disableBody(true, true);
                this.score += p.pickupType === 'health' ? 5 : 1;
                EventBus.emit('score-update', this.score);
            });
        }

        // Score is shown in the React header — no in-game HUD needed

        // --- Debug overlay ---
        this.debugLayer = this.add.container(0, 0).setDepth(90);
        this.debugGraphics = this.add.graphics();
        this.debugLayer.add(this.debugGraphics);
        this.drawDebugOverlays();
        this.debugLayer.setVisible(this.debugEnabled);

        // --- Keyboard input ---
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = {
                W: this.input.keyboard.addKey('W'),
                A: this.input.keyboard.addKey('A'),
                D: this.input.keyboard.addKey('D'),
            };
            this.spaceKey = this.input.keyboard.addKey('SPACE');
        }

        // --- Listen for debug toggle from React ---
        EventBus.on('toggle-debug', this.handleToggleDebug, this);

        // --- Camera follows player ---
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);

        console.info('[GameScene] create: DONE');
        EventBus.emit('current-scene-ready', this);
    }

    update() {
        if (this.gameWon) return;

        const body = this.player.body as Phaser.Physics.Arcade.Body;

        // Read input from keyboard OR mobile controls
        const left = this.inputState.left
            || this.cursors?.left?.isDown
            || this.wasd?.A?.isDown;

        const right = this.inputState.right
            || this.cursors?.right?.isDown
            || this.wasd?.D?.isDown;

        const jump = this.inputState.jump
            || this.cursors?.up?.isDown
            || this.spaceKey?.isDown
            || this.wasd?.W?.isDown;

        // Horizontal movement (world-relative speed)
        if (left) {
            body.setVelocityX(-this.phys.playerSpeed);
        } else if (right) {
            body.setVelocityX(this.phys.playerSpeed);
        } else {
            body.setVelocityX(0);
        }

        // Jump (only when touching ground, world-relative velocity)
        if (jump && body.blocked.down) {
            body.setVelocityY(this.phys.jumpVelocity);
        }

        // Consume jump to prevent continuous jumping from held button
        if (jump && !body.blocked.down) {
            this.inputState.jump = false;
        }
    }

    private handleWin() {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        body.setAllowGravity(false);
        EventBus.emit('game-won', { score: this.score });
    }

    private handleToggleDebug = (enabled: boolean) => {
        this.debugEnabled = enabled;
        this.debugLayer.setVisible(enabled);
    };

    private drawDebugOverlays() {
        const g = this.debugGraphics;
        const markerR = Math.max(this.worldH * 0.008, 4);
        const fontSize = `${Math.max(Math.round(this.worldH * 0.014), 8)}px`;

        for (const obj of this.sceneData.objects) {
            const rect = {
                x: obj.bounds_normalized.x * this.worldW,
                y: obj.bounds_normalized.y * this.worldH,
                w: obj.bounds_normalized.w * this.worldW,
                h: obj.bounds_normalized.h * this.worldH,
            };

            const colors: Record<string, number> = {
                platform: 0x4ade80, obstacle: 0xfbbf24,
                collectible: 0x60a5fa, hazard: 0xef4444, decoration: 0xa78bfa,
            };
            const color = colors[obj.type] ?? 0xffffff;
            g.lineStyle(1, color, 0.5);
            g.strokeRect(rect.x, rect.y, rect.w, rect.h);

            const label = this.add.text(rect.x + 2, rect.y - markerR * 2, `${obj.id}`, {
                fontSize, color: '#fff',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: { x: 3, y: 1 },
            });
            this.debugLayer.add(label);
        }

        const spawns = this.sceneData.spawns;
        this.drawSpawnDot(normToWorldX(spawns.player.x, this.worldW), normToWorldY(spawns.player.y, this.worldH), 0x22d3ee, 'P', markerR, fontSize);
        this.drawSpawnDot(normToWorldX(spawns.exit.x, this.worldW), normToWorldY(spawns.exit.y, this.worldH), 0xfbbf24, 'E', markerR, fontSize);
    }

    private drawSpawnDot(x: number, y: number, color: number, label: string, r: number, fontSize: string) {
        const g = this.debugGraphics;
        g.fillStyle(color, 0.8);
        g.fillCircle(x, y, r);
        const text = this.add.text(x + r + 4, y - r, label, {
            fontSize, fontStyle: 'bold', color: '#fff',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: { x: 3, y: 1 },
        });
        this.debugLayer.add(text);
    }
}
