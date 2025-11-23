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
        const interval = setInterval(calculateTime, 60000); // Update every minute

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
            <div className="container" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1>{t('tracker.title')}</h1>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => navigate('/profile')}
                            className="btn btn-primary"
                            style={{ width: 'auto', padding: '0.5rem 1rem' }}
                        >
                            {t('common.profile')}
                        </button>
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: '0.5rem 1rem',
                                background: 'var(--error-color)',
                                border: 'none',
                                borderRadius: '0.5rem',
                                color: 'white',
                                fontSize: '0.875rem'
                            }}
                        >
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
                    <div className="card text-center" style={{ padding: '3rem' }}>
                        <h2 style={{
                            fontSize: '1.5rem',
                            marginBottom: '2rem',
                            color: 'var(--success-color)'
                        }}>
                            {t('tracker.congratulations')}
                        </h2>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '2rem',
                            flexWrap: 'wrap',
                            marginBottom: '2rem'
                        }}>
                            <div style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                borderRadius: '1rem',
                                padding: '2rem',
                                minWidth: '150px',
                                border: '2px solid var(--success-color)'
                            }}>
                                <div style={{
                                    fontSize: '4rem',
                                    fontWeight: 'bold',
                                    color: 'var(--success-color)',
                                    lineHeight: 1
                                }}>
                                    {daysClean}
                                </div>
                                <div style={{
                                    fontSize: '1rem',
                                    marginTop: '0.5rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {t('tracker.daysTitle')}
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                borderRadius: '1rem',
                                padding: '2rem',
                                minWidth: '120px',
                                border: '2px solid var(--accent-color)'
                            }}>
                                <div style={{
                                    fontSize: '3rem',
                                    fontWeight: 'bold',
                                    color: 'var(--accent-color)',
                                    lineHeight: 1
                                }}>
                                    {hours}
                                </div>
                                <div style={{
                                    fontSize: '0.875rem',
                                    marginTop: '0.5rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {t('tracker.hoursTitle')}
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                borderRadius: '1rem',
                                padding: '2rem',
                                minWidth: '120px',
                                border: '2px solid var(--accent-color)'
                            }}>
                                <div style={{
                                    fontSize: '3rem',
                                    fontWeight: 'bold',
                                    color: 'var(--accent-color)',
                                    lineHeight: 1
                                }}>
                                    {minutes}
                                </div>
                                <div style={{
                                    fontSize: '0.875rem',
                                    marginTop: '0.5rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {t('tracker.minutesTitle')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
