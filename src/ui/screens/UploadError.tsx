/**
 * UPLOAD ERROR SCREEN
 * ===================
 * Displays when the upload fails. Lucide icons replace emojis.
 */

import { XCircle, RefreshCw, Camera } from 'lucide-react';
import { Icon } from '../Icon';
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
                    <div className="error-icon">
                        <Icon icon={XCircle} size={32} />
                    </div>
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
                        <Icon icon={RefreshCw} size={16} /> Try Again
                    </button>
                    <button className="glass-button glass-button--secondary" onClick={onRetake}>
                        <Icon icon={Camera} size={16} /> Retake Photo
                    </button>
                </div>
            </div>
        </div>
    );
}
