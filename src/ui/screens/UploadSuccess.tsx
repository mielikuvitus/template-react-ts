/**
 * UPLOAD SUCCESS SCREEN
 * =====================
 * 
 * Displays when the backend successfully returns Scene JSON.
 * 
 * Shows:
 * - Request ID for reference
 * - Summary counts (objects, enemies, pickups)
 * - Primary "Preview Level" button
 * - Secondary: Upload Again, Retake
 * - Scene JSON viewer (toggleable via dev panel)
 */

import { SceneResponse } from '../../services/ai_proxy_service';
import './UploadScreens.css';

interface UploadSuccessProps {
    requestId: string;
    sceneData: SceneResponse;
    onUploadAgain: () => void;
    onRetake: () => void;
    onPreview: () => void;
    showSceneJson?: boolean;
}

export function UploadSuccess({ 
    requestId, 
    sceneData, 
    onUploadAgain, 
    onRetake,
    onPreview,
    showSceneJson = false,
}: UploadSuccessProps) {
    const { spawns } = sceneData;
    const raw = sceneData as unknown as Record<string, unknown>;
    const objectCount = Array.isArray(raw.objects)
        ? raw.objects.length
        : sceneData.detections.length;

    return (
        <div className="upload-screen">
            <div className="glass-card">
                <div className="request-id">{requestId}</div>

                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <div className="success-icon">✓</div>
                    <h2 className="screen-title">Scene Generated</h2>
                    <p className="screen-subtitle">Ready for preview</p>
                </div>

                <div className="summary-grid" style={{ marginTop: '20px' }}>
                    <div className="summary-item">
                        <span className="summary-label">Objects</span>
                        <span className="summary-value">{objectCount}</span>
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

                {/* Scene JSON viewer - controlled by dev panel toggle */}
                {showSceneJson && (
                    <div className="json-viewer" style={{ marginTop: '16px' }}>
                        {JSON.stringify(sceneData, null, 2)}
                    </div>
                )}

                <div className="button-group" style={{ marginTop: '24px' }}>
                    <button className="glass-button glass-button--hero" onClick={onPreview}>
                        ▶ Preview Level
                    </button>
                    <div className="button-row">
                        <button className="glass-button glass-button--secondary" onClick={onUploadAgain}>
                            ↻ Upload Again
                        </button>
                        <button className="glass-button glass-button--secondary" onClick={onRetake}>
                            📷 Retake
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
