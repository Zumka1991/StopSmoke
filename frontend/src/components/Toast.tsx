import { useEffect } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'info':
                return 'ℹ';
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success':
                return 'var(--success-color)';
            case 'error':
                return 'var(--error-color)';
            case 'info':
                return 'var(--accent-color)';
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '2rem',
                right: '2rem',
                background: 'var(--card-bg)',
                border: `2px solid ${getColor()}`,
                borderRadius: '0.75rem',
                padding: '1rem 1.5rem',
                boxShadow: `0 10px 40px -10px ${getColor()}`,
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                minWidth: '300px',
                maxWidth: '500px',
                zIndex: 9999,
                animation: 'slideInRight 0.3s ease-out'
            }}
        >
            <div
                style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    background: getColor(),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    flexShrink: 0
                }}
            >
                {getIcon()}
            </div>
            <div style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                {message}
            </div>
            <button
                onClick={onClose}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '0.25rem',
                    lineHeight: 1,
                    transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                }}
            >
                ×
            </button>

            <style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
