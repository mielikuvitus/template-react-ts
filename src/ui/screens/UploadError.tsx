/**
 * UPLOAD ERROR SCREEN
 * ===================
 * 
 * Displays when the upload fails (network error, server error, etc).
 * 
 * Shows:
 * - Request ID for debugging with backend logs
 * - Error message and status code
 * - Action buttons: Try Again, Retake Photo
 * 
 * Props:
 * - requestId: string - The request ID for this failed upload
 * - error: Error - The error object with message and optional status
 * - onRetry: () => void - Retry the upload
 * - onRetake: () => void - Return to capture screen
 */

import './UploadScreens.css';

interface UploadErrorProps {
    requestId: string;
    error: Error & { status?: number; responseText?: string };
    onRetry: () => void;
    onRetake: () => void;
}

export function UploadError({ 
    requestId, 
    error, 
    onRetry, 
    onRetake 
}: UploadErrorProps) {
    return (
        <div className="upload-screen">
            <div className="glass-card">
                <div className="request-id">{requestId}</div>

                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <div className="error-icon">✕</div>
                    <h2 className="screen-title">Upload Failed</h2>
                    <p className="screen-subtitle">
                        {error.status ? `Status: ${error.status}` : 'Connection error'}
                    </p>
                </div>

                <div className="error-message" style={{ marginTop: '20px' }}>
                    {error.message}
                    {error.responseText && (
                        <code>{error.responseText.substring(0, 200)}</code>
                    )}
                </div>

                <div className="button-group" style={{ marginTop: '24px' }}>
                    <button className="glass-button glass-button--primary" onClick={onRetry}>
                        ↻ Try Again
                    </button>
                    <button className="glass-button glass-button--secondary" onClick={onRetake}>
                        📷 Retake Photo
                    </button>
                </div>
            </div>
        </div>
    );
}
