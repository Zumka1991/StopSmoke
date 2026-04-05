import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import Button from '../components/Button';
import { CheckCircle, AlertCircle, Lock } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ResetPasswordPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';
    const token = searchParams.get('token') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError(t('auth.passwordMismatch') || 'Пароли не совпадают');
            return;
        }

        if (!token || !email) {
            setError(t('auth.invalidLink') || 'Неверная ссылка');
            return;
        }

        setIsLoading(true);

        try {
            await api.post('/auth/reset-password', {
                email,
                token,
                newPassword
            });
            setIsSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            const errData = err.response?.data;
            if (Array.isArray(errData)) {
                setError(errData.map((e: any) => e.description).join(', '));
            } else {
                setError(errData?.error || t('auth.resetFailed') || 'Ошибка при сбросе пароля');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '450px', marginTop: '4rem', padding: '0 1rem' }}>
            <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                {isSuccess ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <CheckCircle size={32} style={{ color: '#22c55e' }} />
                        </div>
                        <h2 style={{ color: 'var(--success-color)', marginBottom: '0.5rem' }}>
                            {t('auth.passwordChanged') || 'Пароль изменен!'}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            {t('auth.redirectToLogin') || 'Перенаправляем на страницу входа...'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ width: '64px', height: '64px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Lock size={32} style={{ color: 'var(--accent-color)' }} />
                            </div>
                        </div>

                        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            {t('auth.resetPasswordTitle') || 'Новый пароль'}
                        </h2>
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            {email ? `${t('auth.resettingFor') || 'Сброс пароля для:'} ${email}` : ''}
                        </p>

                        {error && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertCircle size={18} />
                                <span style={{ fontSize: '0.9rem' }}>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    {t('auth.newPassword') || 'Новый пароль'}
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    {t('auth.confirmNewPassword') || 'Подтвердите пароль'}
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                                />
                            </div>

                            <Button type="submit" disabled={isLoading} style={{ width: '100%' }}>
                                {isLoading ? <LoadingSpinner size="20px" /> : (t('auth.changePassword') || 'Сменить пароль')}
                            </Button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
