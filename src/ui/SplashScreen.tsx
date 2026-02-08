import { useState, useEffect } from 'react';
import { Camera, Users } from 'lucide-react';
import { SplashLogo } from './SplashLogo';
import { Icon } from './Icon';
import { isSupabaseConfigured } from '../services/supabase';
import './SplashScreen.css';

interface SplashScreenProps {
    onComplete: () => void;
    onBrowse?: () => void;
}

export function SplashScreen({ onComplete, onBrowse }: SplashScreenProps) {
    const [ready, setReady] = useState(false);

    // Brief animated entrance then show buttons
    useEffect(() => {
        const timer = setTimeout(() => setReady(true), 800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="splash-screen">
            <div className="splash-screen__center">
                <div className="splash-screen__group">
                    <h1 className="splash-screen__title logo">Reality Jump</h1>
                    <SplashLogo className="splash-screen__logo" />
                </div>
                <p className="splash-screen__byline">by Pixel Rift</p>
            </div>
            <div className={`splash-screen__buttons ${ready ? 'splash-screen__buttons--visible' : ''}`}>
                <button className="glass-button glass-button--hero splash-btn" onClick={onComplete}>
                    Start
                </button>
                {isSupabaseConfigured() && onBrowse && (
                    <button className="glass-button glass-button--secondary splash-btn" onClick={onBrowse}>
                        <Icon icon={Users} size={18} /> Play Shared Level
                    </button>
                )}
            </div>
        </div>
    );
}
