/**
 * ICON TEXTURE FACTORY
 * =====================
 *
 * Generates simple, crisp sprite textures at runtime using Canvas 2D.
 * No external asset files or async loading required.
 *
 * Each icon is drawn directly onto an offscreen canvas and registered
 * as a Phaser texture synchronously. This avoids async SVG/Image issues.
 *
 * Usage:
 *   ensureIconTexture(scene, 'player', 48, '#22d3ee');
 *   const sprite = scene.add.sprite(x, y, getIconTextureKey('player', 48));
 */

/**
 * Generate a deterministic texture key from icon name and size.
 */
export function getIconTextureKey(iconName: string, sizePx: number): string {
    return `icon_${iconName}_${sizePx}`;
}

/**
 * Draw a specific icon shape onto a canvas context.
 * All drawings are normalized to fit within (0,0)-(size,size).
 */
function drawIcon(ctx: CanvasRenderingContext2D, name: string, size: number, color: string) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(2, size / 16);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.38;

    switch (name) {
        case 'player': {
            // Person icon: head circle + body triangle
            const headR = size * 0.16;
            ctx.beginPath();
            ctx.arc(cx, cy - r * 0.35, headR, 0, Math.PI * 2);
            ctx.fill();

            // Body (inverted triangle)
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.6, cy + r * 0.8);
            ctx.lineTo(cx + r * 0.6, cy + r * 0.8);
            ctx.lineTo(cx, cy - r * 0.05);
            ctx.closePath();
            ctx.fill();
            break;
        }

        case 'exit': {
            // Flag on a pole
            const poleX = cx - r * 0.5;
            // Pole
            ctx.beginPath();
            ctx.moveTo(poleX, cy - r);
            ctx.lineTo(poleX, cy + r);
            ctx.stroke();

            // Flag (filled triangle)
            ctx.beginPath();
            ctx.moveTo(poleX, cy - r);
            ctx.lineTo(poleX + r * 1.3, cy - r * 0.4);
            ctx.lineTo(poleX, cy + r * 0.15);
            ctx.closePath();
            ctx.fill();
            break;
        }

        case 'coin': {
            // Golden circle with 'C' or just a filled circle
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.75, 0, Math.PI * 2);
            ctx.fill();

            // Inner ring
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;
            break;
        }

        case 'health': {
            // Heart shape
            const s = r * 0.85;
            ctx.beginPath();
            ctx.moveTo(cx, cy + s * 0.7);
            ctx.bezierCurveTo(cx - s * 1.5, cy - s * 0.3, cx - s * 0.5, cy - s * 1.2, cx, cy - s * 0.5);
            ctx.bezierCurveTo(cx + s * 0.5, cy - s * 1.2, cx + s * 1.5, cy - s * 0.3, cx, cy + s * 0.7);
            ctx.closePath();
            ctx.fill();
            break;
        }

        default: {
            // Fallback: filled circle
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

/**
 * Ensure an icon texture exists in the scene's texture manager.
 * Draws directly onto canvas — fully synchronous, no async loading.
 */
export function ensureIconTexture(
    scene: Phaser.Scene,
    iconName: string,
    sizePx: number,
    color: string = '#ffffff',
): void {
    const key = getIconTextureKey(iconName, sizePx);

    // Fast path: already loaded
    if (scene.textures.exists(key)) return;

    const canvas = document.createElement('canvas');
    canvas.width = sizePx;
    canvas.height = sizePx;
    const ctx = canvas.getContext('2d')!;

    drawIcon(ctx, iconName, sizePx, color);

    scene.textures.addCanvas(key, canvas);
    console.info(`[IconTextureFactory] Created texture: ${key}`);
}
