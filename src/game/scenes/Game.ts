import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    player: Phaser.Physics.Arcade.Sprite;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    wasd: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
    playerSpeed: number = 200;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        // Simple grid background for spatial reference
        const gfx = this.add.graphics();
        gfx.lineStyle(1, 0x333355, 0.3);
        for (let x = 0; x < 1024; x += 64) {
            gfx.lineBetween(x, 0, x, 768);
        }
        for (let y = 0; y < 768; y += 64) {
            gfx.lineBetween(0, y, 1024, y);
        }

        // Create the player sprite in the center
        this.player = this.physics.add.sprite(512, 384, 'player');
        this.player.setCollideWorldBounds(true);

        // Set up keyboard controls
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = {
            W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        };

        // HUD text
        this.add.text(16, 16, 'Arrow Keys / WASD to move', {
            fontFamily: 'Arial', fontSize: 16, color: '#666666'
        });

        EventBus.emit('current-scene-ready', this);
    }

    update ()
    {
        if (!this.player) return;

        // Reset velocity each frame
        this.player.setVelocity(0);

        // Horizontal movement
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.player.setVelocityX(-this.playerSpeed);
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.player.setVelocityX(this.playerSpeed);
        }

        // Vertical movement
        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            this.player.setVelocityY(-this.playerSpeed);
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            this.player.setVelocityY(this.playerSpeed);
        }

        // Normalize diagonal movement
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (body.velocity.x !== 0 && body.velocity.y !== 0) {
            body.velocity.normalize().scale(this.playerSpeed);
        }
    }

    changeScene ()
    {
        this.scene.start('MainMenu');
    }
}
