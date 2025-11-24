import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function LoginPage() {
    const { t } = useTranslation();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [serverError, setServerError] = useState('');
    const navigate = useNavigate();

    const onSubmit = async (data: any) => {
        try {
            const response = await api.post('/auth/login', data);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('userEmail', response.data.email);
            navigate('/dashboard');
        } catch (err: any) {
            setServerError(t('auth.login.error'));
        }
    };

    return (
        <>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
                <LanguageSwitcher />
            </div>
            <div className="auth-container">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', width: '100%', maxWidth: '400px' }}>
                    <div className="text-center">
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'linear-gradient(135deg, var(--accent-color), #2563eb)',
                            borderRadius: '50%',
                            margin: '0 auto 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
                            animation: 'pulse 2s infinite'
                        }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="m9 12 2 2 4-4" />
                            </svg>
                        </div>
                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: '800',
                            background: 'linear-gradient(to right, #fff, #94a3b8)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '0.5rem'
                        }}>
                            StopSmoke
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                            {t('app.slogan', 'Бросаем курить вместе!')}
                        </p>
                    </div>

                    <div className="card">
                        <h2 className="text-center" style={{ marginBottom: '2rem' }}>{t('auth.login.title')}</h2>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="form-group">
                                <label className="form-label">{t('auth.login.email')}</label>
                                <input
                                    {...register('email', { required: t('auth.register.emailRequired') })}
                                    type="email"
                                    className="form-input"
                                    placeholder="name@example.com"
                                />
                                {errors.email && <p className="error-msg">{errors.email.message as string}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('auth.login.password')}</label>
                                <input
                                    {...register('password', { required: t('auth.register.passwordRequired') })}
                                    type="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                />
                                {errors.password && <p className="error-msg">{errors.password.message as string}</p>}
                            </div>

                            {serverError && <p className="error-msg text-center">{serverError}</p>}

                            <button type="submit" className="btn btn-primary">{t('auth.login.submit')}</button>
                        </form>

                        <p className="text-center" style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
                            {t('auth.login.noAccount')} <Link to="/register" className="link">{t('auth.login.signUp')}</Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
