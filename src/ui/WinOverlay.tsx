/**
 * WIN OVERLAY
 * ============
 *
 * Glassmorphism overlay shown when the player reaches the exit.
 * Shows score and action buttons (Play Again, Retake Photo, Share Level).
 */

import { useState } from 'react';
import { Trophy, RefreshCw, Camera, Share2, Check, Loader2 } from 'lucide-react';
import { Icon } from './Icon';
import './WinOverlay.css';

interface WinOverlayProps {
    score: number;
    onPlayAgain: () => void;
    onRetake: () => void;
    onShare?: (playerName: string, levelName: string) => Promise<void>;
}

type ShareState = 'idle' | 'form' | 'sharing' | 'shared' | 'error';

export function WinOverlay({ score, onPlayAgain, onRetake, onShare }: WinOverlayProps) {
    const [shareState, setShareState] = useState<ShareState>('idle');
    const [playerName, setPlayerName] = useState('');
    const [levelName, setLevelName] = useState('');

    const handleShareSubmit = async () => {
        if (!onShare || !playerName.trim() || !levelName.trim()) return;
        setShareState('sharing');
        try {
            await onShare(playerName.trim(), levelName.trim());
            setShareState('shared');
        } catch {
            setShareState('error');
            setTimeout(() => setShareState('form'), 2000);
        }
    };

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

                {shareState === 'form' && (
                    <div className="win-overlay__share-form">
                        <input
                            className="glass-input"
                            type="text"
                            placeholder="Your name"
                            maxLength={30}
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            autoFocus
                        />
                        <input
                            className="glass-input"
                            type="text"
                            placeholder="Level name"
                            maxLength={40}
                            value={levelName}
                            onChange={(e) => setLevelName(e.target.value)}
                        />
                        <button
                            className="glass-button glass-button--hero"
                            onClick={handleShareSubmit}
                            disabled={!playerName.trim() || !levelName.trim()}
                        >
                            <Icon icon={Share2} size={16} /> Share
                        </button>
                        <button
                            className="glass-button glass-button--secondary"
                            onClick={() => setShareState('idle')}
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {shareState === 'sharing' && (
                    <div className="win-overlay__share-status">
                        <Icon icon={Loader2} size={20} className="spin" /> Sharing...
                    </div>
                )}

                {shareState === 'shared' && (
                    <div className="win-overlay__share-status win-overlay__share-status--success">
                        <Icon icon={Check} size={20} /> Level shared!
                    </div>
                )}

                {shareState === 'error' && (
                    <div className="win-overlay__share-status win-overlay__share-status--error">
                        Failed to share. Retrying...
                    </div>
                )}

                {(shareState === 'idle' || shareState === 'shared') && (
                    <div className="win-overlay__actions">
                        {onShare && shareState !== 'shared' && (
                            <button className="glass-button glass-button--hero" onClick={() => setShareState('form')}>
                                <Icon icon={Share2} size={16} /> Share Level
                            </button>
                        )}
                        <button className="glass-button glass-button--hero" onClick={onPlayAgain}>
                            <Icon icon={RefreshCw} size={16} /> Play Again
                        </button>
                        <button className="glass-button glass-button--secondary" onClick={onRetake}>
                            <Icon icon={Camera} size={16} /> New Photo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
