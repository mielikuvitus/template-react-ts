import { useState, useCallback } from 'react';
import { CameraCapture, CaptureData } from './CameraCapture';
import './CaptureScreen.css';

interface CaptureScreenProps {
    onNext?: (captureData: CaptureData) => void;
}

export function CaptureScreen({ onNext }: CaptureScreenProps) {
    const [captureData, setCaptureData] = useState<CaptureData | null>(null);

    const handleCapture = useCallback((data: CaptureData) => {
        setCaptureData(data);
    }, []);

    const handleNextClick = useCallback(() => {
        if (captureData && onNext) {
            onNext(captureData);
        }
    }, [captureData, onNext]);

    const hasCapture = captureData !== null;

    return (
        <div className="capture-screen">
            <header className="capture-screen__header">
                <h1 className="capture-screen__title">Capture Your Scene</h1>
                <p className="capture-screen__subtitle">
                    Take a photo to generate your game level
                </p>
            </header>

            <main className="capture-screen__content">
                <CameraCapture onCapture={handleCapture} />
            </main>

            <footer className="capture-screen__footer">
                <button
                    type="button"
                    className="capture-screen__next-button"
                    disabled={!hasCapture}
                    onClick={handleNextClick}
                >
                    {hasCapture ? '✓ Next: Generate Level' : 'Take a photo to continue'}
                </button>
            </footer>
        </div>
    );
}
