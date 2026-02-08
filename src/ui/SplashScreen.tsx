import { useState, useEffect } from 'react';
import { SplashLogo } from './SplashLogo';
import './SplashScreen.css';

interface SplashScreenProps {
    onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
    const [fading, setFading] = useState(false);

    useEffect(() => {
        // Show title for 3 seconds, then start fade
        const showTimer = setTimeout(() => {
            setFading(true);
        }, 3000);

        // After fade completes (3s + 0.8s transition), notify parent
        const completeTimer = setTimeout(() => {
            onComplete();
        }, 3800);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <div className={`splash-screen ${fading ? 'splash-screen--fading' : ''}`}>
            <div className="splash-screen__center">
                <div className="splash-screen__group">
                    <h1 className="splash-screen__title logo">Reality Jump</h1>
                    <SplashLogo className="splash-screen__logo" />
                </div>
                <p className="splash-screen__byline">by Pixel Rift</p>
            </div>
        </div>
    );
}
