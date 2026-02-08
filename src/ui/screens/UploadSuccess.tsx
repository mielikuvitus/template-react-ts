/**
 * UPLOAD SUCCESS SCREEN
 * =====================
 * Shows when the backend returns Scene JSON. Lucide icons replace emojis.
 */

import { useState } from 'react';
import { Play, RefreshCw, Camera } from 'lucide-react';
import { SceneResponse } from '../../services/ai_proxy_service';
import { Icon } from '../Icon';
import './UploadScreens.css';

interface UploadSuccessProps {
    requestId: string;
    sceneData: SceneResponse;
    onUploadAgain: () => void;
    onRetake: () => void;
    onPreview: () => void;
    onPlay?: () => void;
    showSceneJson?: boolean;
}

type JsonTab = 'scene' | 'llm';

export function UploadSuccess({ 
    requestId, 
    sceneData, 
    onUploadAgain, 
    onRetake,
    onPreview,
    onPlay,
    showSceneJson = false,
}: UploadSuccessProps) {
    const [activeTab, setActiveTab] = useState<JsonTab>('llm');
    const { spawns } = sceneData;
    const raw = sceneData as unknown as Record<string, unknown>;
    const objectCount = Array.isArray(raw.objects)
        ? raw.objects.length
        : 0;

    // Extract debug data
    const debugData = sceneData._debug;
    let llmJson: string | null = null;
    if (debugData) {
        try {
            // raw_ai_response is the raw string from GPT; parse it for pretty-print
            const parsed = typeof debugData.raw_ai_response === 'string'
                ? JSON.parse(debugData.raw_ai_response)
                : debugData.raw_ai_response;
            llmJson = JSON.stringify(parsed, null, 2);
        } catch {
            llmJson = debugData.raw_ai_response;
        }
    }

    // Build scene JSON without the _debug field for cleaner display
    const sceneOnly = { ...sceneData };
    delete (sceneOnly as any)._debug;
    const sceneJson = JSON.stringify(sceneOnly, null, 2);

    return (
        <div className="upload-screen">
            <div className="glass-card">
                <div className="request-id">{requestId}</div>

                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <div className="success-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    </div>
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
                        <span className="summary-label">Collectibles</span>
                        <span className="summary-value">{spawns.pickups.length}</span>
                    </div>
                </div>

                {showSceneJson && (
                    <div style={{ marginTop: '16px' }}>
                        <div className="json-tabs">
                            {llmJson && (
                                <button
                                    className={`json-tab ${activeTab === 'llm' ? 'json-tab--active' : ''}`}
                                    onClick={() => setActiveTab('llm')}
                                >
                                    LLM Response
                                </button>
                            )}
                            <button
                                className={`json-tab ${activeTab === 'scene' ? 'json-tab--active' : ''}`}
                                onClick={() => setActiveTab('scene')}
                            >
                                Scene JSON
                            </button>
                        </div>
                        <div className="json-viewer">
                            {activeTab === 'llm' && llmJson
                                ? llmJson
                                : sceneJson}
                        </div>
                    </div>
                )}

                <div className="button-group" style={{ marginTop: '24px' }}>
                    {onPlay && (
                        <button className="glass-button glass-button--hero" onClick={onPlay}>
                            <Icon icon={Play} size={20} /> Play Level
                        </button>
                    )}
                    <button className="glass-button glass-button--secondary" onClick={onPreview}>
                        <Icon icon={Play} size={14} /> Preview Level
                    </button>
                    <button className="glass-button glass-button--secondary" onClick={onRetake}>
                        <Icon icon={Camera} size={14} /> Retake Photo
                    </button>
                </div>
            </div>
        </div>
    );
}
