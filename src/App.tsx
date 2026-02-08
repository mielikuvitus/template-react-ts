import { useState, useCallback } from 'react';
import { CaptureAndUploadScreen } from './ui/CaptureAndUploadScreen';
import { SplashScreen } from './ui/SplashScreen';
import { BrowseLevelsScreen } from './ui/BrowseLevelsScreen';
import { PlayScreen } from './ui/PlayScreen';
import type { SharedLevelFull } from './services/supabase';

type AppScreen = 'splash' | 'capture' | 'browse' | 'play-shared';

function App() {
    const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash');
    const [sharedLevel, setSharedLevel] = useState<SharedLevelFull | null>(null);

    const handleSplashComplete = useCallback(() => {
        setCurrentScreen('capture');
    }, []);

    const handleBrowse = useCallback(() => {
        setCurrentScreen('browse');
    }, []);

    const handleSelectLevel = useCallback((level: SharedLevelFull) => {
        setSharedLevel(level);
        setCurrentScreen('play-shared');
    }, []);

    const handleBackToSplash = useCallback(() => {
        setSharedLevel(null);
        setCurrentScreen('splash');
    }, []);

    if (currentScreen === 'splash') {
        return <SplashScreen onComplete={handleSplashComplete} onBrowse={handleBrowse} />;
    }

    if (currentScreen === 'capture') {
        return <CaptureAndUploadScreen />;
    }

    if (currentScreen === 'browse') {
        return (
            <BrowseLevelsScreen
                onSelectLevel={handleSelectLevel}
                onBack={handleBackToSplash}
            />
        );
    }

    if (currentScreen === 'play-shared' && sharedLevel) {
        return (
            <PlayScreen
                photoUrl={sharedLevel.image_url}
                sceneData={sharedLevel.scene_data}
                onBack={handleBackToSplash}
                onRetake={handleBackToSplash}
            />
        );
    }

    return <SplashScreen onComplete={handleSplashComplete} onBrowse={handleBrowse} />;
}

export default App;
