'use client';

import { useEffect, useState } from 'react';
import '@/styles/onboarding.css';

interface ToastProps {
    message: string;
    type?: 'success' | 'info';
    duration?: number;
    onClose?: () => void;
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            onClose?.();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!isVisible) return null;

    return (
        <div className={`toast-notification ${type}`}>
            <div className="toast-icon">
                {type === 'success' ? '✅' : 'ℹ️'}
            </div>
            <div className="toast-content">
                <p className="toast-message">{message}</p>
            </div>
        </div>
    );
}
