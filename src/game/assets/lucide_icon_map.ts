/**
 * LUCIDE ICON MAP FOR PHASER SPRITES
 * ====================================
 *
 * Maps game entity keys to SVG path data from Lucide icons.
 * Only a small whitelist of icons is included to keep the bundle tiny.
 *
 * SVG paths extracted from lucide-icons (MIT license).
 * Each entry: viewBox is 24x24, stroke-based, 2px stroke.
 */

export interface LucideIconDef {
    /** Display name for debugging */
    name: string;
    /** SVG path elements (d attribute content) */
    paths: string[];
}

export const ICON_MAP: Record<string, LucideIconDef> = {
    player: {
        name: 'User',
        paths: [
            'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2',
            'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
        ],
    },
    exit: {
        name: 'Flag',
        paths: [
            'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z',
            'M4 22v-7',
        ],
    },
    coin: {
        name: 'Coins',
        paths: [
            'M9 14a6.97 6.97 0 0 0 3-6.5A6.97 6.97 0 0 0 9 1',
            'M2 9.5a7 7 0 0 0 14 0 7 7 0 0 0-14 0z',
        ],
    },
    health: {
        name: 'Heart',
        paths: [
            'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
        ],
    },
};
