import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import Button from '../components/Button';
import { ArrowLeft, Mail } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await api.post('/auth/forgot-password', email, {
                headers: { 'Content-Type': 'application/json' }
            });
            setIsSent(true);
        } catch (err: any) {
            setError(err.response?.data?.error || t('auth.resetFailed') || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '450px', marginTop: '4rem', padding: '0 1rem' }}>
            <button 
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1rem' }}
            >
                <ArrowLeft size={20} />
                {t('common.back') || 'Back'}
            </button>

            <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                    {t('auth.forgotPasswordTitle') || 'Забыли пароль?'}
                </h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    {t('auth.forgotPasswordHint') || 'Введите email, и мы пришлем ссылку для восстановления'}
                </p>

                {isSent ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <Mail size={32} style={{ color: '#22c55e' }} />
                        </div>
                        <h3 style={{ color: 'var(--success-color)', marginBottom: '0.5rem' }}>
                            {t('auth.checkEmail') || 'Проверьте почту!'}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {t('auth.emailSentHint') || 'Мы отправили вам ссылку для сброса пароля.'}
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                                {error}
                            </div>
                        )}
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <Button type="submit" disabled={isLoading} style={{ width: '100%' }}>
                            {isLoading ? <LoadingSpinner size="20px" /> : (t('auth.sendResetLink') || 'Отправить ссылку')}
                        </Button>
                    </form>
                )}

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <Link to="/login" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontSize: '0.9rem' }}>
                        {t('auth.backToLogin') || 'Вернуться ко входу'}
                    </Link>
                </div>
            </div>
        </div>
    );
}
