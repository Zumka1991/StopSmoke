import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import LanguageSwitcher from '../components/LanguageSwitcher';

interface ProfileData {
    email: string;
    quitDate: string | null;
    cigarettesPerDay: number;
    pricePerPack: number;
    currency: string;
}

export default function DashboardPage() {
    const { t } = useTranslation();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [daysClean, setDaysClean] = useState(0);
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/profile');
                setProfile(response.data);
            } catch (err) {
                console.error('Failed to load profile');
            }
        };

        fetchProfile();
    }, []);

    useEffect(() => {
        if (!profile?.quitDate) return;

        const calculateTime = () => {
            const quitTime = new Date(profile.quitDate!).getTime();
            const now = new Date().getTime();
            const diff = now - quitTime;

            if (diff < 0) {
                setDaysClean(0);
                setHours(0);
                setMinutes(0);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setDaysClean(days);
            setHours(hoursLeft);
            setMinutes(minutesLeft);
        };

        calculateTime();
        const interval = setInterval(calculateTime, 60000);

        return () => clearInterval(interval);
    }, [profile]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        navigate('/login');
    };

    if (!profile) {
        return <div className="container text-center">Loading...</div>;
    }

    return (
        <>
            <LanguageSwitcher />
            <div className="container" style={{ marginTop: '2rem', maxWidth: '1200px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1>{t('tracker.title')}</h1>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={() => navigate('/profile')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.15))',
                                border: '2px solid rgba(59, 130, 246, 0.4)',
                                borderRadius: '0.75rem',
                                color: 'var(--accent-color)',
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.25))';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.15))';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <span>👤</span>
                            {t('common.profile')}
                        </button>
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.15))',
                                border: '2px solid rgba(239, 68, 68, 0.4)',
                                borderRadius: '0.75rem',
                                color: '#ef4444',
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.25))';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.15))';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <span>🚪</span>
                            {t('common.logout')}
                        </button>
                    </div>
                </div>

                {!profile.quitDate ? (
                    <div className="card text-center" style={{ padding: '3rem' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{t('tracker.notStarted')}</h2>
                        <button
                            onClick={() => navigate('/profile')}
                            className="btn btn-primary"
                            style={{ width: 'auto', padding: '0.75rem 2rem', margin: '0 auto' }}
                        >
                            {t('tracker.goToProfile')}
                        </button>
                    </div>
                ) : (
                    <>
                        <h2 style={{
                            fontSize: '1.5rem',
                            marginBottom: '2rem',
                            textAlign: 'center',
                            color: 'var(--success-color)'
                        }}>
                            {t('tracker.congratulations')}
                        </h2>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '3rem'
                        }}>
                            <div style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                borderRadius: '1rem',
                                padding: '2.5rem',
                                border: '2px solid var(--success-color)',
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    fontSize: '4.5rem',
                                    fontWeight: 'bold',
                                    color: 'var(--success-color)',
                                    lineHeight: 1
                                }}>
                                    {daysClean}
                                </div>
                                <div style={{
                                    fontSize: '1.1rem',
                                    marginTop: '0.75rem',
                                    color: 'var(--text-secondary)',
                                    fontWeight: '500'
                                }}>
                                    {t('tracker.daysTitle')}
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                borderRadius: '1rem',
                                padding: '2.5rem',
                                border: '2px solid var(--accent-color)',
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    fontSize: '3.5rem',
                                    fontWeight: 'bold',
                                    color: 'var(--accent-color)',
                                    lineHeight: 1
                                }}>
                                    {hours}
                                </div>
                                <div style={{
                                    fontSize: '1rem',
                                    marginTop: '0.75rem',
                                    color: 'var(--text-secondary)',
                                    fontWeight: '500'
                                }}>
                                    {t('tracker.hoursTitle')}
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                borderRadius: '1rem',
                                padding: '2.5rem',
                                border: '2px solid var(--accent-color)',
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    fontSize: '3.5rem',
                                    fontWeight: 'bold',
                                    color: 'var(--accent-color)',
                                    lineHeight: 1
                                }}>
                                    {minutes}
                                </div>
                                <div style={{
                                    fontSize: '1rem',
                                    marginTop: '0.75rem',
                                    color: 'var(--text-secondary)',
                                    fontWeight: '500'
                                }}>
                                    {t('tracker.minutesTitle')}
                                </div>
                            </div>
                        </div>

                        {profile.cigarettesPerDay > 0 && profile.pricePerPack > 0 && (
                            <>
                                <h3 style={{
                                    textAlign: 'center',
                                    marginBottom: '2rem',
                                    color: 'var(--text-secondary)',
                                    fontSize: '1.5rem'
                                }}>
                                    💰 {t('tracker.moneySaved')}
                                </h3>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                    gap: '1.5rem'
                                }}>
                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1))',
                                        borderRadius: '1rem',
                                        padding: '2.5rem',
                                        border: '2px solid rgba(34, 197, 94, 0.4)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{
                                            fontSize: '3rem',
                                            fontWeight: 'bold',
                                            color: 'var(--success-color)',
                                            marginBottom: '0.5rem'
                                        }}>
                                            {(() => {
                                                const cigarettesNotSmoked = daysClean * profile.cigarettesPerDay;
                                                const packsNotSmoked = cigarettesNotSmoked / 20;
                                                const moneySaved = packsNotSmoked * profile.pricePerPack;
                                                return moneySaved.toLocaleString('en-US', { maximumFractionDigits: 0 });
                                            })()}
                                        </div>
                                        <div style={{
                                            fontSize: '1.5rem',
                                            fontWeight: '600',
                                            color: 'var(--success-color)',
                                            marginBottom: '0.5rem'
                                        }}>
                                            {profile.currency}
                                        </div>
                                        <div style={{
                                            fontSize: '1rem',
                                            color: 'var(--text-secondary)',
                                            fontWeight: '500'
                                        }}>
                                            {t('tracker.moneySaved')}
                                        </div>
                                    </div>

                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.1))',
                                        borderRadius: '1rem',
                                        padding: '2.5rem',
                                        border: '2px solid rgba(59, 130, 246, 0.4)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{
                                            fontSize: '3rem',
                                            fontWeight: 'bold',
                                            color: 'var(--accent-color)',
                                            marginBottom: '0.5rem'
                                        }}>
                                            {(daysClean * profile.cigarettesPerDay).toLocaleString()}
                                        </div>
                                        <div style={{
                                            fontSize: '1rem',
                                            color: 'var(--text-secondary)',
                                            marginTop: '1rem',
                                            fontWeight: '500'
                                        }}>
                                            {t('tracker.cigarettesNotSmoked')}
                                        </div>
                                    </div>

                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(147, 51, 234, 0.1))',
                                        borderRadius: '1rem',
                                        padding: '2.5rem',
                                        border: '2px solid rgba(168, 85, 247, 0.4)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{
                                            fontSize: '3rem',
                                            fontWeight: 'bold',
                                            color: '#a855f7',
                                            marginBottom: '0.5rem'
                                        }}>
                                            {((daysClean * profile.cigarettesPerDay) / 20).toLocaleString('en-US', { maximumFractionDigits: 1 })}
                                        </div>
                                        <div style={{
                                            fontSize: '1rem',
                                            color: 'var(--text-secondary)',
                                            marginTop: '1rem',
                                            fontWeight: '500'
                                        }}>
                                            {t('tracker.packsNotSmoked')}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
