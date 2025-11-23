import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import Navbar from '../components/Navbar';

interface ProfileData {
    email: string;
    quitDate: string | null;
    cigarettesPerDay: number;
    pricePerPack: number;
    currency: string;
}

export default function ProfilePage() {
    const { t } = useTranslation();
    const { register, handleSubmit, setValue } = useForm();
    const [loading, setLoading] = useState(true);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/profile');
                const data: ProfileData = response.data;

                // Convert ISO date to datetime-local format (YYYY-MM-DDTHH:mm)
                if (data.quitDate) {
                    const date = new Date(data.quitDate);
                    const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16);
                    setValue('quitDate', localDateTime);
                } else {
                    setValue('quitDate', '');
                }

                setValue('cigarettesPerDay', data.cigarettesPerDay);
                setValue('pricePerPack', data.pricePerPack);
                setValue('currency', data.currency);

                setLoading(false);
            } catch (err) {
                setLoading(false);
                setErrorMsg('Failed to load profile');
            }
        };

        fetchProfile();
    }, [setValue]);

    const onSubmit = async (data: any) => {
        try {
            // Convert datetime-local to ISO format for API
            const quitDateValue = data.quitDate ? new Date(data.quitDate).toISOString() : null;

            await api.put('/profile', {
                quitDate: quitDateValue,
                cigarettesPerDay: parseInt(data.cigarettesPerDay) || 0,
                pricePerPack: parseFloat(data.pricePerPack) || 0,
                currency: data.currency
            });
            setSuccessMsg(t('profile.updateSuccess'));
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err: any) {
            console.error('Profile update error:', err);
            setErrorMsg(err.response?.data?.message || t('profile.updateError'));
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        navigate('/login');
    };

    if (loading) {
        return <div className="container text-center">Loading...</div>;
    }

    return (
        <>
            <Navbar onLogout={handleLogout} />
            <div className="container" style={{ maxWidth: '600px', marginTop: '3rem' }}>
                <div className="card">
                    <h2 style={{ marginBottom: '2rem' }}>{t('profile.title')}</h2>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="form-group">
                            <label className="form-label">{t('profile.quitDate')}</label>

                            {/* Quick Start Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    const now = new Date();
                                    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                                        .toISOString()
                                        .slice(0, 16);
                                    setValue('quitDate', localDateTime);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    marginBottom: '1rem',
                                    background: 'linear-gradient(135deg, var(--success-color), #16a34a)',
                                    border: 'none',
                                    borderRadius: '0.75rem',
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(34, 197, 94, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
                                }}
                            >
                                🚭 {t('profile.startNow')}
                            </button>

                            {/* Divider */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                margin: '1rem 0',
                                gap: '1rem'
                            }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    {t('profile.quitDateHelper')}
                                </span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                            </div>

                            {/* Date/Time Picker */}
                            <input
                                {...register('quitDate')}
                                type="datetime-local"
                                className="form-input"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))',
                                    border: '2px solid rgba(59, 130, 246, 0.3)',
                                    padding: '1rem',
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    color: 'var(--text-primary)',
                                    borderRadius: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    colorScheme: 'dark'
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.border = '2px solid var(--accent-color)';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.border = '2px solid rgba(59, 130, 246, 0.3)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('profile.cigarettesPerDay')}</label>
                            <input
                                {...register('cigarettesPerDay')}
                                type="number"
                                min="0"
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('profile.pricePerPack')}</label>
                            <input
                                {...register('pricePerPack')}
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('profile.currency')}</label>
                            <select {...register('currency')} className="form-input">
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="RUB">RUB</option>
                            </select>
                        </div>

                        {successMsg && <p style={{ color: 'var(--success-color)', textAlign: 'center', marginBottom: '1rem' }}>{successMsg}</p>}
                        {errorMsg && <p className="error-msg text-center">{errorMsg}</p>}

                        <button type="submit" className="btn btn-primary">{t('common.save')}</button>
                    </form>
                </div>
            </div>
        </>
    );
}
