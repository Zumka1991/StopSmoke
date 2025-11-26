import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

interface ProfileData {
    email: string;
    name: string;
    quitDate: string | null;
    cigarettesPerDay: number;
    pricePerPack: number;
    currency: string;
    showInLeaderboard: boolean;
}

interface Relapse {
    id: number;
    date: string;
    reason?: string;
}

export default function ProfilePage() {
    const { t } = useTranslation();
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            showInLeaderboard: true
        }
    });
    const quitDate = watch('quitDate');
    const showInLeaderboard = watch('showInLeaderboard');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [showRelapseModal, setShowRelapseModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [relapseReason, setRelapseReason] = useState('');
    const [relapses, setRelapses] = useState<Relapse[]>([]);
    const [submittingRelapse, setSubmittingRelapse] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/profile');
                const data: ProfileData = response.data;

                // Set name
                setValue('name', data.name || '');

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
                setValue('showInLeaderboard', data.showInLeaderboard ?? true);

                setLoading(false);
            } catch (err) {
                setLoading(false);
                setToast({ message: 'Failed to load profile', type: 'error' });
            }
        };

        fetchProfile();
    }, [setValue]);

    const handleToggleLeaderboard = async (newValue: boolean) => {
        setValue('showInLeaderboard', newValue);

        try {
            const formData = watch();
            const quitDateValue = formData.quitDate ? new Date(formData.quitDate).toISOString() : null;

            await api.put('/profile', {
                name: formData.name,
                quitDate: quitDateValue,
                cigarettesPerDay: parseInt(formData.cigarettesPerDay) || 0,
                pricePerPack: parseFloat(formData.pricePerPack) || 0,
                currency: formData.currency,
                showInLeaderboard: newValue
            });
            setToast({ message: t('profile.updateSuccess'), type: 'success' });
        } catch (err: any) {
            console.error('Profile update error:', err);
            setToast({ message: err.response?.data?.message || t('profile.updateError'), type: 'error' });
            // Revert on error
            setValue('showInLeaderboard', !newValue);
        }
    };

    const onSubmit = async (data: any) => {
        setSaving(true);
        try {
            // Convert datetime-local to ISO format for API
            const quitDateValue = data.quitDate ? new Date(data.quitDate).toISOString() : null;

            await api.put('/profile', {
                name: data.name,
                quitDate: quitDateValue,
                cigarettesPerDay: parseInt(data.cigarettesPerDay) || 0,
                pricePerPack: parseFloat(data.pricePerPack) || 0,
                currency: data.currency,
                showInLeaderboard: data.showInLeaderboard ?? true
            });
            setToast({ message: t('profile.updateSuccess'), type: 'success' });
        } catch (err: any) {
            console.error('Profile update error:', err);
            setToast({ message: err.response?.data?.message || t('profile.updateError'), type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        navigate('/login');
    };

    const fetchRelapses = async () => {
        try {
            const response = await api.get('/relapse');
            setRelapses(response.data);
        } catch (err) {
            console.error('Failed to load relapses', err);
        }
    };

    const handleRelapseSubmit = async () => {
        setSubmittingRelapse(true);
        try {
            await api.post('/relapse', { reason: relapseReason || null });
            setToast({ message: t('relapse.success'), type: 'success' });
            setShowRelapseModal(false);
            setRelapseReason('');
            setValue('quitDate', ''); // Reset quit date locally
            fetchRelapses();
        } catch (err) {
            setToast({ message: t('relapse.error'), type: 'error' });
        } finally {
            setSubmittingRelapse(false);
        }
    };

    const openHistoryModal = () => {
        fetchRelapses();
        setShowHistoryModal(true);
    };

    if (loading) {
        return (
            <div className="container" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <LoadingSpinner size="60px" />
                <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
            </div>
        );
    }

    const now = new Date();
    const maxDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

    return (
        <>
            <Navbar onLogout={handleLogout} />
            <div className="container" style={{
                maxWidth: '1000px',
                margin: '3rem auto',
                paddingBottom: '3rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '1.5rem',
                alignItems: 'stretch'
            }}>
                {/* Profile Settings Card */}
                <div className="card">
                    <h2 style={{ marginBottom: '2rem' }}>{t('profile.title')}</h2>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="form-group">
                            <label className="form-label">{t('profile.name')}</label>
                            <input
                                {...register('name', {
                                    required: true,
                                    minLength: 3
                                })}
                                type="text"
                                className="form-input"
                                placeholder={t('profile.namePlaceholder')}
                            />
                        </div>

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
                                {...register('quitDate', {
                                    validate: (value) => {
                                        if (!value) return true;
                                        return new Date(value) <= new Date() || t('profile.futureDateError');
                                    }
                                })}
                                max={maxDate}
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
                            {errors.quitDate && (
                                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', display: 'block' }}>
                                    {errors.quitDate.message as string}
                                </span>
                            )}
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

                        <div className="form-group" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '2px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '0.75rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                            e.currentTarget.style.borderColor = 'var(--accent-color)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                        }}>
                            <div>
                                <label className="form-label" style={{ marginBottom: '0.25rem', cursor: 'pointer' }}>
                                    {t('profile.showInLeaderboard')}
                                </label>
                                <p style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--text-secondary)',
                                    margin: 0
                                }}>
                                    {t('profile.showInLeaderboardHint')}
                                </p>
                            </div>
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleLeaderboard(!showInLeaderboard);
                                }}
                                style={{
                                    position: 'relative',
                                    display: 'inline-block',
                                    width: '60px',
                                    height: '34px',
                                    flexShrink: 0,
                                    backgroundColor: showInLeaderboard ? 'var(--success-color)' : 'rgba(255, 255, 255, 0.2)',
                                    borderRadius: '34px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.3s'
                                }}
                            >
                                <input
                                    {...register('showInLeaderboard')}
                                    type="checkbox"
                                    style={{ display: 'none' }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '50%',
                                    backgroundColor: 'white',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                    top: '4px',
                                    left: showInLeaderboard ? '30px' : '4px',
                                    transition: 'left 0.3s'
                                }}></div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                            style={{
                                opacity: saving ? 0.7 : 1,
                                cursor: saving ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {saving && <LoadingSpinner size="20px" />}
                            {saving ? t('common.saving') || 'Saving...' : t('common.save')}
                        </button>
                    </form>
                </div>

                {/* Relapse Management Card */}
                <div className="card">
                    <h2 style={{ marginBottom: '1rem' }}>{t('relapse.title')}</h2>
                    <p style={{
                        color: 'var(--text-secondary)',
                        marginBottom: '1.5rem',
                        fontSize: '0.95rem',
                        lineHeight: '1.5'
                    }}>
                        {t('relapse.description')}
                    </p>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '1rem'
                    }}>
                        {quitDate && (
                            <button
                                onClick={() => setShowRelapseModal(true)}
                                style={{
                                    padding: '1.25rem',
                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                    border: 'none',
                                    borderRadius: '0.75rem',
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                                }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>😔</span>
                                <span>{t('relapse.iRelapsed')}</span>
                            </button>
                        )}

                        <button
                            onClick={openHistoryModal}
                            style={{
                                padding: '1.25rem',
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))',
                                border: '2px solid rgba(59, 130, 246, 0.4)',
                                borderRadius: '0.75rem',
                                color: 'var(--text-primary)',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.3))';
                                e.currentTarget.style.border = '2px solid var(--accent-color)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))';
                                e.currentTarget.style.border = '2px solid rgba(59, 130, 246, 0.4)';
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>📊</span>
                            <span>{t('relapse.history')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Relapse Modal */}
            {showRelapseModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }} onClick={() => setShowRelapseModal(false)}>
                    <div className="card" style={{
                        maxWidth: '500px',
                        width: '100%',
                        margin: 0
                    }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{t('relapse.modalTitle')}</h3>

                        <div className="form-group">
                            <label className="form-label">{t('relapse.reasonLabel')}</label>
                            <textarea
                                value={relapseReason}
                                onChange={(e) => setRelapseReason(e.target.value)}
                                className="form-input"
                                placeholder={t('relapse.reasonPlaceholder')}
                                rows={4}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button
                                onClick={handleRelapseSubmit}
                                disabled={submittingRelapse}
                                className="btn btn-primary"
                                style={{
                                    flex: 1,
                                    opacity: submittingRelapse ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {submittingRelapse && <LoadingSpinner size="20px" />}
                                {submittingRelapse ? t('common.saving') : t('relapse.submit')}
                            </button>
                            <button
                                onClick={() => {
                                    setShowRelapseModal(false);
                                    setRelapseReason('');
                                }}
                                disabled={submittingRelapse}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1.5rem',
                                    background: 'transparent',
                                    border: '2px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '0.5rem',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: submittingRelapse ? 'not-allowed' : 'pointer',
                                    opacity: submittingRelapse ? 0.5 : 1
                                }}
                            >
                                {t('relapse.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }} onClick={() => setShowHistoryModal(false)}>
                    <div className="card" style={{
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        margin: 0
                    }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{t('relapse.historyTitle')}</h3>

                        {relapses.length === 0 ? (
                            <p style={{
                                textAlign: 'center',
                                color: 'var(--text-secondary)',
                                padding: '2rem'
                            }}>
                                {t('relapse.emptyHistory')}
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {relapses.map((relapse) => (
                                    <div key={relapse.id} style={{
                                        padding: '1rem',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '0.5rem'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <strong>{t('relapse.date')}:</strong>
                                            <span>{new Date(relapse.date).toLocaleString('ru-RU')}</span>
                                        </div>
                                        {relapse.reason && (
                                            <div>
                                                <strong>{t('relapse.reason')}:</strong>
                                                <p style={{
                                                    marginTop: '0.5rem',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    {relapse.reason}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => setShowHistoryModal(false)}
                            className="btn btn-primary"
                            style={{ marginTop: '1.5rem', width: '100%' }}
                        >
                            {t('relapse.close')}
                        </button>
                    </div>
                </div>
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    );
}
