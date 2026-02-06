/**
 * UPLOAD SUCCESS SCREEN
 * =====================
 * 
 * Displays when the backend successfully returns Scene JSON.
 * 
 * Shows:
 * - Request ID for reference
 * - Summary of scene data (player, exit, counts)
 * - Collapsible JSON viewer
 * - Action buttons: Upload Again, Retake, Copy JSON
 * 
 * Props:
 * - requestId: string - The request ID for this upload
 * - sceneData: object - The Scene JSON from backend
 * - onUploadAgain: () => void - Re-upload same photo
 * - onRetake: () => void - Return to capture screen
 */

import { useState, useCallback } from 'react';
import { SceneResponse } from '../../services/ai_proxy_service';
import './UploadScreens.css';

interface UploadSuccessProps {
    requestId: string;
    sceneData: SceneResponse;
    onUploadAgain: () => void;
    onRetake: () => void;
}

export function UploadSuccess({ 
    requestId, 
    sceneData, 
    onUploadAgain, 
    onRetake 
}: UploadSuccessProps) {
    const [showJson, setShowJson] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopyJson = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(sceneData, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }, [sceneData]);

    const { spawns, detections, surfaces, rules } = sceneData;
    const playerCoords = spawns.player 
        ? `(${spawns.player.x.toFixed(2)}, ${spawns.player.y.toFixed(2)})`
        : 'N/A';
    const exitCoords = spawns.exit
        ? `(${spawns.exit.x.toFixed(2)}, ${spawns.exit.y.toFixed(2)})`
        : 'N/A';

    return (
        <div className="upload-screen">
            <div className="glass-card">
                <div className="request-id">{requestId}</div>

                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <div className="success-icon">✓</div>
                    <h2 className="screen-title">Scene Generated</h2>
                    <p className="screen-subtitle">Ready for gameplay</p>
                </div>

                <div className="summary-grid" style={{ marginTop: '20px' }}>
                    <div className="summary-item">
                        <span className="summary-label">Player</span>
                        <span className="summary-value">{playerCoords}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Exit</span>
                        <span className="summary-value">{exitCoords}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Detections</span>
                        <span className="summary-value">{detections.length}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Surfaces</span>
                        <span className="summary-value">{surfaces.length}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Enemies</span>
                        <span className="summary-value">{spawns.enemies.length}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Pickups</span>
                        <span className="summary-value">{spawns.pickups.length}</span>
                    </div>
                </div>

                <button 
                    className="glass-button glass-button--secondary glass-button--small"
                    onClick={() => setShowJson(!showJson)}
                    style={{ marginTop: '16px', width: '100%' }}
                >
                    {showJson ? '▲ Hide JSON' : '▼ Show JSON'}
                </button>

                {showJson && (
                    <div className="json-viewer" style={{ marginTop: '12px' }}>
                        {JSON.stringify(sceneData, null, 2)}
                    </div>
                )}

                <div className="button-group" style={{ marginTop: '20px' }}>
                    <button className="glass-button glass-button--primary" onClick={onUploadAgain}>
                        ↻ Upload Again
                    </button>
                    <div className="button-row">
                        <button className="glass-button glass-button--secondary" onClick={onRetake}>
                            📷 Retake
                        </button>
                        <button className="glass-button glass-button--secondary" onClick={handleCopyJson}>
                            📋 Copy
                        </button>
                    </div>
                </div>
            </div>

            {copied && (
                <div className="copy-feedback">JSON copied to clipboard</div>
            )}
        </div>
    );
}
