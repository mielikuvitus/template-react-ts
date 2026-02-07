/**
 * PREVIEW SCREEN (Step 3)
 * ========================
 *
 * Shows the Phaser level preview after successful Scene JSON validation.
 *
 * Contains:
 * - Phaser GameContainer (renders photo + debug overlays)
 * - Debug toggle button
 * - Back button to return to success screen
 *
 * The scene data is validated with Zod BEFORE this screen is shown.
 * If validation fails, the app shows ValidationErrorScreen instead.
 */

import { useState } from 'react';
import { GameContainer } from '../game/GameContainer';
import type { SceneV1 } from '../shared/schema/scene_v1.types';
import './PreviewScreen.css';

const isDev = import.meta.env.DEV;

interface PreviewScreenProps {
    photoUrl: string;
    sceneData: SceneV1;
    onBack: () => void;
}

export function PreviewScreen({ photoUrl, sceneData, onBack }: PreviewScreenProps) {
    const [debugEnabled, setDebugEnabled] = useState(isDev);

    return (
        <div className="preview-screen">
            <div className="preview-screen__header">
                <button className="preview-screen__back-btn" onClick={onBack}>
                    ← Back
                </button>
                <h1 className="preview-screen__title">Level Preview</h1>
                <button
                    className={`preview-screen__debug-btn ${debugEnabled ? 'preview-screen__debug-btn--active' : ''}`}
                    onClick={() => setDebugEnabled(!debugEnabled)}
                >
                    {debugEnabled ? '⊡ Debug' : '⊟ Debug'}
                </button>
            </div>

            <div className="preview-screen__canvas">
                <GameContainer
                    photoUrl={photoUrl}
                    sceneData={sceneData}
                    debugEnabled={debugEnabled}
                />
            </div>

            <div className="preview-screen__info">
                <div className="preview-screen__stat">
                    <span className="preview-screen__stat-label">Objects</span>
                    <span className="preview-screen__stat-value">{sceneData.objects.length}</span>
                </div>
                <div className="preview-screen__stat">
                    <span className="preview-screen__stat-label">Enemies</span>
                    <span className="preview-screen__stat-value">{sceneData.spawns.enemies.length}</span>
                </div>
                <div className="preview-screen__stat">
                    <span className="preview-screen__stat-label">Pickups</span>
                    <span className="preview-screen__stat-value">{sceneData.spawns.pickups.length}</span>
                </div>
            </div>
        </div>
    );
}
