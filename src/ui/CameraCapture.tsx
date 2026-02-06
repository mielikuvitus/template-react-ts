import { useRef, useState, useEffect, useCallback } from 'react';
import { downscaleImageToBlob, bytesToKb, DownscaleResult } from '../services/image_processing_service';
import './CameraCapture.css';

export interface CaptureData {
    originalFile: File;
    compressedBlob: Blob;
    width: number;
    height: number;
}

interface CameraCaptureProps {
    onCapture?: (data: CaptureData) => void;
    onRetake?: () => void;
    maxSize?: number;
    quality?: number;
    showDebugInfo?: boolean;
}

export function CameraCapture({ 
    onCapture,
    onRetake,
    maxSize = 1024, 
    quality = 0.75,
    showDebugInfo = false,
}: CameraCaptureProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [captureData, setCaptureData] = useState<CaptureData | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Clean up object URLs on unmount or when preview changes
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        
        // Handle user canceling file selection
        if (!file) {
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        setError(null);
        setIsProcessing(true);

        // Revoke previous preview URL if exists
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        try {
            // Create preview URL
            const newPreviewUrl = URL.createObjectURL(file);
            setPreviewUrl(newPreviewUrl);

            // Compress the image
            const result: DownscaleResult = await downscaleImageToBlob(file, maxSize, quality);

            const newCaptureData: CaptureData = {
                originalFile: file,
                compressedBlob: result.blob,
                width: result.width,
                height: result.height,
            };

            setCaptureData(newCaptureData);
            
            if (onCapture) {
                onCapture(newCaptureData);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process image');
            setPreviewUrl(null);
            setCaptureData(null);
        } finally {
            setIsProcessing(false);
        }
    }, [previewUrl, maxSize, quality, onCapture]);

    const handleRetake = useCallback(() => {
        // Revoke current preview URL
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        
        setPreviewUrl(null);
        setCaptureData(null);
        setError(null);
        
        // Reset the input so the same file can be selected again
        if (inputRef.current) {
            inputRef.current.value = '';
        }

        // Notify parent
        if (onRetake) {
            onRetake();
        }
    }, [previewUrl, onRetake]);

    const triggerCapture = useCallback(() => {
        inputRef.current?.click();
    }, []);

    return (
        <div className="camera-capture">
            {/* Hidden file input for camera capture */}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="camera-capture__input"
                aria-label="Take photo"
            />

            {!previewUrl && !isProcessing && (
                <label 
                    className="camera-capture__button"
                    onClick={triggerCapture}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && triggerCapture()}
                >
                    📷 Take Photo
                </label>
            )}

            {isProcessing && (
                <div className="camera-capture__button" aria-busy="true">
                    Processing...
                </div>
            )}

            {error && (
                <div className="camera-capture__error" role="alert">
                    {error}
                </div>
            )}

            {previewUrl && captureData && !isProcessing && (
                <div className="camera-capture__preview-container">
                    <img
                        src={previewUrl}
                        alt="Captured photo preview"
                        className="camera-capture__preview"
                    />

                    <button
                        type="button"
                        className="camera-capture__retake"
                        onClick={handleRetake}
                    >
                        🔄 Retake Photo
                    </button>

                    {/* Debug info - controlled by showDebugInfo prop */}
                    {showDebugInfo && (
                        <div className="camera-capture__debug">
                            <h4 className="camera-capture__debug-title">Image Info</h4>
                            <ul className="camera-capture__debug-list">
                                <li className="camera-capture__debug-item">
                                    <span className="camera-capture__debug-label">Original size:</span>
                                    <span className="camera-capture__debug-value">
                                        {bytesToKb(captureData.originalFile.size)} KB
                                    </span>
                                </li>
                                <li className="camera-capture__debug-item">
                                    <span className="camera-capture__debug-label">Compressed size:</span>
                                    <span className="camera-capture__debug-value">
                                        {bytesToKb(captureData.compressedBlob.size)} KB
                                    </span>
                                </li>
                                <li className="camera-capture__debug-item">
                                    <span className="camera-capture__debug-label">Dimensions:</span>
                                    <span className="camera-capture__debug-value">
                                        {captureData.width} × {captureData.height}
                                    </span>
                                </li>
                                <li className="camera-capture__debug-item">
                                    <span className="camera-capture__debug-label">Compression:</span>
                                    <span className="camera-capture__debug-value">
                                        {Math.round((1 - captureData.compressedBlob.size / captureData.originalFile.size) * 100)}% saved
                                    </span>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
