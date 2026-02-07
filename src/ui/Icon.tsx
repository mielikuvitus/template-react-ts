/**
 * ICON WRAPPER
 * ============
 *
 * Central wrapper to standardize Lucide icon sizing and alignment across UI.
 *
 * Usage:
 *   import { Camera } from 'lucide-react';
 *   <Icon icon={Camera} />
 *   <Icon icon={Camera} size={24} />
 */

import type { LucideIcon } from 'lucide-react';
import './Icon.css';

interface IconProps {
    icon: LucideIcon;
    size?: number;
    className?: string;
}

export function Icon({ icon: LucideComponent, size = 18, className = '' }: IconProps) {
    return (
        <LucideComponent
            className={`ui-icon ${className}`}
            width={size}
            height={size}
            strokeWidth={2}
        />
    );
}
