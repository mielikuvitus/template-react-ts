/**
 * UPLOAD LOADING SCREEN
 * =====================
 * 
 * Displays while image is being uploaded to the backend.
 * 
 * Shows:
 * - Running stick man animation
 * - Request ID for tracing (matches backend logs)
 * - Animated loading bar
 * - Status message
 * 
 * Props:
 * - requestId: string - The unique request ID for this upload
 */

import { SplashLogo } from '../SplashLogo';
import './UploadScreens.css';

interface UploadLoadingProps {
    requestId: string;
}

export function UploadLoading({ requestId }: UploadLoadingProps) {
    return (
        <div className="upload-screen">
            <div className="glass-card">
                <div className="request-id">{requestId}</div>

                <div className="loading-runner">
                    <SplashLogo className="loading-runner__figure" />
                </div>
                
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <h2 className="screen-title">
                        Generating Scene
                        <span className="loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </h2>
                    <p className="screen-subtitle">
                        Analyzing your photo
                    </p>
                </div>

                <div className="loading-bar-container">
                    <div className="loading-bar"></div>
                </div>
            </div>
        </div>
    );
}
