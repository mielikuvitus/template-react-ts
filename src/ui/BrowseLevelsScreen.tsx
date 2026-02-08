/**
 * BROWSE LEVELS SCREEN
 * =====================
 *
 * Lists shared levels from Supabase. Players can search by name
 * and tap a level to play it.
 */

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Search, Loader2, MapPin, User, Trophy } from 'lucide-react';
import { fetchLevels, fetchLevel } from '../services/supabase';
import type { SharedLevel, SharedLevelFull } from '../services/supabase';
import { Icon } from './Icon';
import { SplashLogo } from './SplashLogo';
import './BrowseLevelsScreen.css';

interface BrowseLevelsScreenProps {
    onSelectLevel: (level: SharedLevelFull) => void;
    onBack: () => void;
}

export function BrowseLevelsScreen({ onSelectLevel, onBack }: BrowseLevelsScreenProps) {
    const [levels, setLevels] = useState<SharedLevel[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingLevel, setLoadingLevel] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadLevels = useCallback(async (query?: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchLevels(query);
            setLevels(data);
        } catch {
            setError('Failed to load levels');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadLevels();
    }, [loadLevels]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            loadLevels(search);
        }, 400);
        return () => clearTimeout(timer);
    }, [search, loadLevels]);

    const handleSelect = async (level: SharedLevel) => {
        setLoadingLevel(level.id);
        try {
            const full = await fetchLevel(level.id);
            if (full) {
                onSelectLevel(full);
            } else {
                setError('Failed to load level data');
            }
        } catch {
            setError('Failed to load level');
        } finally {
            setLoadingLevel(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="browse-screen">
            <SplashLogo className="browse-screen__bg-logo" />

            <nav className="browse-screen__nav">
                <button className="browse-screen__back-btn" onClick={onBack}>
                    <Icon icon={ArrowLeft} size={16} /> Back
                </button>
                <span className="browse-screen__nav-title logo">Shared Levels</span>
            </nav>

            <div className="browse-screen__search">
                <Icon icon={Search} size={16} className="browse-screen__search-icon" />
                <input
                    className="glass-input browse-screen__search-input"
                    type="text"
                    placeholder="Search levels or players..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="browse-screen__list">
                {loading && (
                    <div className="browse-screen__status">
                        <Icon icon={Loader2} size={24} className="spin" />
                        <p>Loading levels...</p>
                    </div>
                )}

                {error && (
                    <div className="browse-screen__status browse-screen__status--error">
                        <p>{error}</p>
                        <button className="glass-button glass-button--secondary" onClick={() => loadLevels(search)}>
                            Retry
                        </button>
                    </div>
                )}

                {!loading && !error && levels.length === 0 && (
                    <div className="browse-screen__status">
                        <p>No shared levels yet. Be the first!</p>
                    </div>
                )}

                {!loading && levels.map((level) => (
                    <button
                        key={level.id}
                        className="browse-screen__card"
                        onClick={() => handleSelect(level)}
                        disabled={loadingLevel === level.id}
                    >
                        <div className="browse-screen__card-main">
                            <span className="browse-screen__card-level">
                                <Icon icon={MapPin} size={14} /> {level.level_name}
                            </span>
                            <span className="browse-screen__card-player">
                                <Icon icon={User} size={12} /> {level.player_name}
                            </span>
                        </div>
                        <div className="browse-screen__card-meta">
                            <span className="browse-screen__card-score">
                                <Icon icon={Trophy} size={12} /> {level.score}
                            </span>
                            <span className="browse-screen__card-date">
                                {formatDate(level.created_at)}
                            </span>
                        </div>
                        {loadingLevel === level.id && (
                            <div className="browse-screen__card-loading">
                                <Icon icon={Loader2} size={16} className="spin" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
