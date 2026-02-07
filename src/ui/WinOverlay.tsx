/**
 * WIN OVERLAY
 * ============
 *
 * Glassmorphism overlay shown when the player reaches the exit.
 * Shows score and action buttons (Play Again, Retake Photo).
 */

import { Trophy, RefreshCw, Camera } from 'lucide-react';
import { Icon } from './Icon';
import './WinOverlay.css';

interface WinOverlayProps {
    score: number;
    onPlayAgain: () => void;
    onRetake: () => void;
}

export function WinOverlay({ score, onPlayAgain, onRetake }: WinOverlayProps) {
    return (
        <div className="win-overlay">
            <div className="win-overlay__card">
                <div className="win-overlay__icon">
                    <Icon icon={Trophy} size={48} />
                </div>
                <h2 className="win-overlay__title">You Win!</h2>
                {score > 0 && (
                    <p className="win-overlay__score">Score: {score}</p>
                )}
                <div className="win-overlay__actions">
                    <button className="glass-button glass-button--hero" onClick={onPlayAgain}>
                        <Icon icon={RefreshCw} size={16} /> Play Again
                    </button>
                    <button className="glass-button glass-button--secondary" onClick={onRetake}>
                        <Icon icon={Camera} size={16} /> New Photo
                    </button>
                </div>
            </div>
        </div>
    );
}
