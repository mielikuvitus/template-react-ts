import { Scene } from 'phaser';

import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.add.text(512, 300, 'Simple Movement Game', {
            fontFamily: 'Arial Black', fontSize: 48, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(512, 420, 'Click to Start', {
            fontFamily: 'Arial', fontSize: 24, color: '#aaaaaa',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(512, 480, 'Use Arrow Keys or WASD to move', {
            fontFamily: 'Arial', fontSize: 18, color: '#666666',
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('Game');
        });

        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('Game');
    }
}
