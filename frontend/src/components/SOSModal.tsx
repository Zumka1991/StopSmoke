import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SOSModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SOSModal({ isOpen, onClose }: SOSModalProps) {
    const { t } = useTranslation();
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [breathingState, setBreathingState] = useState('breatheIn'); // breatheIn, hold, breatheOut

    // Timer logic
    useEffect(() => {
        if (!isOpen) {
            setTimeLeft(180);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen]);

    // Quote rotation logic
    useEffect(() => {
        if (!isOpen) return;

        const quotes = t('sos.quotes', { returnObjects: true }) as string[];
        // Pick random quote initially
        setQuoteIndex(Math.floor(Math.random() * quotes.length));

        const quoteInterval = setInterval(() => {
            setQuoteIndex(prev => (prev + 1) % quotes.length);
        }, 10000); // Change quote every 10 seconds

        return () => clearInterval(quoteInterval);
    }, [isOpen, t]);

    // Breathing text logic (sync with CSS animation)
    useEffect(() => {
        if (!isOpen) return;

        // 4-7-8 technique: 4s Inhale, 7s Hold, 8s Exhale = 19s total
        const cycle = () => {
            setBreathingState('breatheIn');
            setTimeout(() => {
                setBreathingState('hold');
                setTimeout(() => {
                    setBreathingState('breatheOut');
                }, 7000); // Hold for 7s
            }, 4000); // Inhale for 4s
        };

        cycle();
        const breathingInterval = setInterval(cycle, 19000);

        return () => clearInterval(breathingInterval);
    }, [isOpen]);

    if (!isOpen) return null;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const quotes = t('sos.quotes', { returnObjects: true }) as string[];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backdropFilter: 'blur(10px)'
        }}>
            <h2 style={{
                color: 'var(--error-color)',
                marginBottom: '2rem',
                fontSize: '2rem',
                textTransform: 'uppercase',
                letterSpacing: '2px'
            }}>
                {t('sos.title')}
            </h2>

            {/* Breathing Circle */}
            <div style={{ marginBottom: '3rem', position: 'relative' }}>
                <div className="breathing-circle">
                    {t(`sos.${breathingState}`)}
                </div>
            </div>

            {/* Timer */}
            <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                marginBottom: '1rem',
                color: timeLeft === 0 ? 'var(--success-color)' : 'white'
            }}>
                {formatTime(timeLeft)}
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>
                {t('sos.timer')}
            </p>

            {/* Quote */}
            <div style={{
                maxWidth: '600px',
                textAlign: 'center',
                marginBottom: '3rem',
                minHeight: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <p style={{
                    fontSize: '1.25rem',
                    fontStyle: 'italic',
                    color: 'var(--text-primary)',
                    lineHeight: '1.6'
                }}>
                    "{quotes[quoteIndex]}"
                </p>
            </div>

            {/* Close Button */}
            <button
                onClick={onClose}
                className="btn"
                style={{
                    background: 'var(--success-color)',
                    color: 'white',
                    padding: '1rem 3rem',
                    fontSize: '1.2rem',
                    borderRadius: '2rem',
                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)',
                    transform: 'scale(1)',
                    transition: 'all 0.3s'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(34, 197, 94, 0.6)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.4)';
                }}
            >
                {t('sos.feelingBetter')}
            </button>
        </div>
    );
}
