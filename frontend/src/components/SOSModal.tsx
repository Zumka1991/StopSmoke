import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';

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
        <div className="sos-modal-overlay" style={{
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
            padding: '1rem',
            backdropFilter: 'blur(10px)',
            overflowY: 'auto'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                maxWidth: '600px',
                padding: '1rem 0'
            }}>
                <h2 className="sos-title" style={{
                    color: 'var(--error-color)',
                    marginBottom: '1.5rem',
                    fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    textAlign: 'center'
                }}>
                    {t('sos.title')}
                </h2>

                {/* Breathing Circle */}
                <div style={{ marginBottom: '2rem', position: 'relative' }}>
                    <div className="breathing-circle" style={{
                        fontSize: 'clamp(1rem, 3vw, 1.2rem)'
                    }}>
                        {t(`sos.${breathingState}`)}
                    </div>
                </div>

                {/* Timer */}
                <div className="sos-timer" style={{
                    fontSize: 'clamp(2rem, 8vw, 3rem)',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    marginBottom: '0.5rem',
                    color: timeLeft === 0 ? 'var(--success-color)' : 'white'
                }}>
                    {formatTime(timeLeft)}
                </div>
                <p style={{
                    color: 'var(--text-secondary)',
                    marginBottom: '2rem',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    textAlign: 'center'
                }}>
                    {t('sos.timer')}
                </p>

                {/* Quote */}
                <div style={{
                    width: '100%',
                    maxWidth: '600px',
                    textAlign: 'center',
                    marginBottom: '2rem',
                    minHeight: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 1rem'
                }}>
                    <p className="sos-quote" style={{
                        fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                        fontStyle: 'italic',
                        color: 'var(--text-primary)',
                        lineHeight: '1.6',
                        margin: 0
                    }}>
                        "{quotes[quoteIndex]}"
                    </p>
                </div>

                {/* Close Button */}
                <Button
                    onClick={onClose}
                    variant="success"
                    size="lg"
                    style={{
                        padding: 'clamp(0.75rem, 2vw, 1rem) clamp(2rem, 5vw, 3rem)',
                        fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                        borderRadius: '2rem',
                        width: '100%',
                        maxWidth: '400px'
                    }}
                >
                    {t('sos.feelingBetter')}
                </Button>
            </div>
        </div>
    );
}
