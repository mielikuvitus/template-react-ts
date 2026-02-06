/**
 * CAPTURE AND UPLOAD SCREEN
 * =========================
 * 
 * This component orchestrates the full flow:
 * 1. Photo capture (using CameraCapture component)
 * 2. Photo upload → Scene JSON (using UploadFlow component)
 * 
 * FLOW:
 * - Initial: Show CameraCapture with "Take Photo" button
 * - After capture: Show photo preview + retake + upload button
 * - During upload: Show loading screen
 * - On success: Show Scene JSON summary
 * - On error: Show error with retry option
 * - Retake: Reset to initial capture state
 * 
 * DEV PANEL (persisted to localStorage):
 * - Show Image Info: Toggle visibility of image debug data (size, dimensions, compression)
 * - Force Success: Always show success on real success (default ON in dev)
 * - Demo Random: 50/50 chance to show fake error after real success
 * 
 * INTEGRATION NOTES:
 * - CameraCapture handles mobile camera access and image compression
 * - UploadFlow handles the API call and result display
 * - This screen ties them together and manages the overall state
 * 
 * NEXT STEP (Step 3):
 * - When success, pass sceneData to Phaser game initialization
 * - Add "Start Game" button on success screen
 */

import { useState, useCallback, useEffect } from 'react';
import { CameraCapture, CaptureData } from './CameraCapture';
import { UploadFlow } from './UploadFlow';
import './CaptureAndUploadScreen.css';

type ScreenState = 'capture' | 'preview' | 'uploading';

// Check if we're in dev mode
const isDev = import.meta.env.DEV;

// LocalStorage keys
const STORAGE_KEYS = {
    showImageInfo: 'dev_showImageInfo',
    demoRandom: 'dev_demoRandom',
    mockMode: 'dev_mockMode',
    mockFallback: 'dev_mockFallback',
};

export function CaptureAndUploadScreen() {
    const [screenState, setScreenState] = useState<ScreenState>('capture');
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

    // Dev panel state
    const [devPanelOpen, setDevPanelOpen] = useState(true);
    const [showImageInfo, setShowImageInfo] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.showImageInfo);
        return stored === 'true'; // Default OFF
    });
    const [demoRandom, setDemoRandom] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.demoRandom);
        return stored === 'true'; // Default OFF
    });
    const [mockMode, setMockMode] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.mockMode);
        return stored === 'true'; // Default OFF
    });
    const [mockFallback, setMockFallback] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.mockFallback);
        return stored === 'true'; // Default OFF
    });

    // Persist toggles
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.showImageInfo, String(showImageInfo));
    }, [showImageInfo]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.demoRandom, String(demoRandom));
    }, [demoRandom]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.mockMode, String(mockMode));
    }, [mockMode]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.mockFallback, String(mockFallback));
    }, [mockFallback]);

    const handleCapture = useCallback((data: CaptureData) => {
        setCapturedBlob(data.compressedBlob);
        setScreenState('preview');
    }, []);

    const handleRetake = useCallback(() => {
        setCapturedBlob(null);
        setScreenState('capture');
    }, []);

    const handleUploadStart = useCallback(() => {
        setScreenState('uploading');
    }, []);

    const getSubtitle = () => {
        switch (screenState) {
            case 'capture':
                return 'Take a photo to create your level';
            case 'preview':
                return 'Review your photo or upload';
            case 'uploading':
                return 'Generating your scene...';
            default:
                return '';
        }
    };

    return (
        <div className="capture-upload-screen">
            <div className="capture-upload-screen__header">
                <h1 className="capture-upload-screen__title">Scene Generator</h1>
                <p className="capture-upload-screen__subtitle">{getSubtitle()}</p>
            </div>

            <div className="capture-upload-screen__content">
                {/* Show CameraCapture for capture and preview states */}
                {(screenState === 'capture' || screenState === 'preview') && (
                    <CameraCapture 
                        onCapture={handleCapture}
                        onRetake={handleRetake}
                        showDebugInfo={showImageInfo}
                    />
                )}

                {/* Show upload button when we have a photo */}
                {screenState === 'preview' && capturedBlob && (
                    <div className="capture-upload-screen__upload-section">
                        <UploadFlow 
                            blob={capturedBlob}
                            onRetake={handleRetake}
                            onUploadStart={handleUploadStart}
                            demoRandom={demoRandom}
                            mockMode={mockMode}
                            mockFallback={mockFallback}
                        />
                    </div>
                )}

                {/* Show upload flow for uploading state */}
                {screenState === 'uploading' && (
                    <UploadFlow 
                        blob={capturedBlob}
                        onRetake={handleRetake}
                        autoStart={true}
                        demoRandom={demoRandom}
                        mockMode={mockMode}
                        mockFallback={mockFallback}
                    />
                )}
            </div>

            {/* Dev Panel - only in dev mode */}
            {isDev && (
                <div className={`dev-panel ${!devPanelOpen ? 'dev-panel--minimized' : ''}`}>
                    <div className="dev-panel__header">
                        <span className="dev-panel__title">Dev</span>
                        <button 
                            className="dev-panel__toggle-btn"
                            onClick={() => setDevPanelOpen(!devPanelOpen)}
                        >
                            {devPanelOpen ? '−' : '+'}
                        </button>
                    </div>
                    
                    {devPanelOpen && (
                        <div className="dev-panel__content">
                            <div className="dev-panel__item">
                                <span className="dev-panel__label">Image Info</span>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={showImageInfo}
                                        onChange={(e) => setShowImageInfo(e.target.checked)}
                                    />
                                    <span className="toggle-switch__slider"></span>
                                </label>
                            </div>
                            <div className="dev-panel__section">
                                <div className="dev-panel__section-title">Backend</div>
                                <div className="dev-panel__item">
                                    <span className="dev-panel__label">Demo Random</span>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={demoRandom}
                                            onChange={(e) => setDemoRandom(e.target.checked)}
                                        />
                                        <span className="toggle-switch__slider"></span>
                                    </label>
                                </div>
                                <div className="dev-panel__item">
                                    <span className="dev-panel__label">Mock Fallback</span>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={mockFallback}
                                            onChange={(e) => setMockFallback(e.target.checked)}
                                        />
                                        <span className="toggle-switch__slider"></span>
                                    </label>
                                </div>
                            </div>

                            <div className="dev-panel__divider"></div>

                            <div className="dev-panel__section">
                                <div className="dev-panel__section-title">No Backend</div>
                                <div className="dev-panel__item">
                                    <span className="dev-panel__label">Mock Mode</span>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={mockMode}
                                            onChange={(e) => setMockMode(e.target.checked)}
                                        />
                                        <span className="toggle-switch__slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
