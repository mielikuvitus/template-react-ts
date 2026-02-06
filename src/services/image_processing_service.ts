/**
 * Image processing utilities for mobile photo capture.
 * Framework-agnostic - no React, no Phaser dependencies.
 */

export interface DownscaleResult {
    blob: Blob;
    width: number;
    height: number;
}

/**
 * Convert bytes to kilobytes with 2 decimal places.
 */
export function bytesToKb(bytes: number): string {
    return (bytes / 1024).toFixed(2);
}

/**
 * Downscale an image file to a JPEG blob.
 * @param file - The original image file
 * @param maxSize - Maximum dimension (width or height) in pixels
 * @param quality - JPEG quality (0-1)
 * @returns Promise with the compressed blob and final dimensions
 */
export async function downscaleImageToBlob(
    file: File,
    maxSize: number = 1024,
    quality: number = 0.75
): Promise<DownscaleResult> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            // Revoke the object URL as soon as the image is loaded
            URL.revokeObjectURL(objectUrl);

            // Calculate new dimensions while maintaining aspect ratio
            let { width, height } = img;
            
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = Math.round((height / width) * maxSize);
                    width = maxSize;
                } else {
                    width = Math.round((width / height) * maxSize);
                    height = maxSize;
                }
            }

            // Create canvas and draw the scaled image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Convert to JPEG blob
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve({ blob, width, height });
                    } else {
                        reject(new Error('Failed to create blob from canvas'));
                    }
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image'));
        };

        img.src = objectUrl;
    });
}
