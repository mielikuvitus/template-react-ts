/**
 * VALIDATION ERROR SCREEN
 * ========================
 *
 * Shown when Scene JSON fails Zod validation.
 * This prevents Phaser from starting with invalid data.
 *
 * Shows:
 * - "Invalid Scene JSON" heading
 * - Expandable list of validation errors
 * - Back button to return to success/upload screen
 */

import { useState } from 'react';
import './ValidationErrorScreen.css';

interface ValidationErrorScreenProps {
    errors: string[];
    onBack: () => void;
}

export function ValidationErrorScreen({ errors, onBack }: ValidationErrorScreenProps) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="validation-error-screen">
            <div className="validation-error-screen__card glass-card">
                <div className="validation-error-screen__icon">⚠</div>
                <h2 className="validation-error-screen__title">Invalid Scene JSON</h2>
                <p className="validation-error-screen__subtitle">
                    The backend response failed validation.
                    Phaser cannot render this data.
                </p>

                <button
                    className="validation-error-screen__toggle"
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? '▲' : '▼'} {errors.length} validation error{errors.length !== 1 ? 's' : ''}
                </button>

                {expanded && (
                    <ul className="validation-error-screen__errors">
                        {errors.map((err, i) => (
                            <li key={i} className="validation-error-screen__error-item">
                                {err}
                            </li>
                        ))}
                    </ul>
                )}

                <div className="validation-error-screen__actions">
                    <button
                        className="glass-button glass-button--primary"
                        onClick={onBack}
                    >
                        ← Back to Results
                    </button>
                </div>
            </div>
        </div>
    );
}
