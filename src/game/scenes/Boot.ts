import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    create ()
    {
        // Generate a simple player texture (32x32 colored square)
        const gfx = this.make.graphics({ x: 0, y: 0 });
        gfx.fillStyle(0x00ff88, 1);
        gfx.fillRoundedRect(0, 0, 32, 32, 6);
        gfx.generateTexture('player', 32, 32);
        gfx.destroy();

        this.scene.start('Game');
    }
}
