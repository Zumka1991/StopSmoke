import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../components/Logo';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Button from '../components/Button';
import SOSModal from '../components/SOSModal';
import { useState, useEffect } from 'react';

export default function LandingPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [sosOpen, setSosOpen] = useState(false);

    // Redirect authenticated users to dashboard
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    const features = [
        {
            icon: '📊',
            title: t('landing.features.tracking.title'),
            description: t('landing.features.tracking.description')
        },
        {
            icon: '🏆',
            title: t('landing.features.motivation.title'),
            description: t('landing.features.motivation.description')
        },
        {
            icon: '👥',
            title: t('landing.features.community.title'),
            description: t('landing.features.community.description')
        },
        {
            icon: '📰',
            title: t('landing.features.articles.title'),
            description: t('landing.features.articles.description')
        }
    ];

    return (
        <>
            <SOSModal isOpen={sosOpen} onClose={() => setSosOpen(false)} />

            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Language Switcher */}
                <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 10 }}>
                    <LanguageSwitcher />
                </div>

                {/* Hero Section */}
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    {/* Logo and Title */}
                    <div style={{ marginBottom: '3rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                            <Logo size={100} showText={false} />
                        </div>
                        <h1 style={{
                            fontSize: 'clamp(2.5rem, 8vw, 4rem)',
                            fontWeight: '800',
                            color: '#ffffff',
                            marginBottom: '1rem'
                        }}>
                            StopSmoke
                        </h1>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
                            maxWidth: '600px',
                            margin: '0 auto 2rem'
                        }}>
                            {t('landing.hero.subtitle')}
                        </p>
                    </div>

                    {/* CTA Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        marginBottom: '3rem'
                    }}>
                        <Button
                            onClick={() => navigate('/register')}
                            variant="primary"
                            size="lg"
                            style={{ minWidth: '200px' }}
                        >
                            {t('landing.hero.getStarted')}
                        </Button>
                        <Button
                            onClick={() => navigate('/login')}
                            variant="outline"
                            size="lg"
                            style={{ minWidth: '200px' }}
                        >
                            {t('landing.hero.login')}
                        </Button>
                    </div>

                    {/* SOS Button */}
                    <div style={{ marginBottom: '3rem' }}>
                        <button
                            onClick={() => setSosOpen(true)}
                            style={{
                                padding: '1rem 2rem',
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
                                border: '2px solid rgba(239, 68, 68, 0.6)',
                                borderRadius: '1rem',
                                color: 'white',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.5)',
                                animation: 'sos-pulse 2s ease-in-out infinite'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.7)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.5)';
                            }}
                        >
                            🆘 {t('landing.hero.emergency')}
                        </button>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.9rem',
                            marginTop: '0.5rem'
                        }}>
                            {t('landing.hero.emergencyHint')}
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '2rem',
                        marginBottom: '3rem'
                    }}>
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                style={{
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    borderRadius: '1rem',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    transition: 'all 0.3s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                                    {feature.icon}
                                </div>
                                <h3 style={{
                                    color: 'var(--text-primary)',
                                    fontSize: '1.25rem',
                                    marginBottom: '0.5rem',
                                    fontWeight: '600'
                                }}>
                                    {feature.title}
                                </h3>
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.95rem',
                                    lineHeight: '1.6'
                                }}>
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Public Pages Links */}
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <Button
                            onClick={() => navigate('/articles')}
                            variant="outline"
                        >
                            📰 {t('landing.explore.articles')}
                        </Button>
                        <Button
                            onClick={() => navigate('/leaderboard')}
                            variant="outline"
                        >
                            🏆 {t('landing.explore.leaderboard')}
                        </Button>
                        <Button
                            onClick={() => navigate('/marathons')}
                            variant="outline"
                        >
                            🏃 {t('landing.explore.marathons')}
                        </Button>
                    </div>
                </div>

                <style>{`
                    @keyframes sos-pulse {
                        0%, 100% {
                            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
                        }
                        50% {
                            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.7), 0 0 30px rgba(239, 68, 68, 0.5);
                        }
                    }
                `}</style>
            </div>
        </>
    );
}
