import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReCAPTCHA from 'react-google-recaptcha';
import api from '../api/axios';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Logo from '../components/Logo';
import Button from '../components/Button';

export default function RegisterPage() {
    const { t } = useTranslation();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [serverError, setServerError] = useState('');
    const [recaptchaError, setRecaptchaError] = useState('');
    const navigate = useNavigate();
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const onSubmit = async (data: any) => {
        // Check reCAPTCHA
        const recaptchaToken = recaptchaRef.current?.getValue();
        if (!recaptchaToken) {
            setRecaptchaError(t('auth.register.recaptchaRequired'));
            return;
        }

        try {
            await api.post('/auth/register', {
                ...data,
                recaptchaToken
            });
            navigate('/login');
        } catch (err: any) {
            if (err.response?.data?.errors) {
                const errorMessages = err.response.data.errors.map((e: any) => e.description).join(', ');
                setServerError(errorMessages);
            } else {
                setServerError(err.response?.data?.message || t('auth.register.error'));
            }
            // Reset reCAPTCHA on error
            recaptchaRef.current?.reset();
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
                        <div style={{ margin: '0 auto 1rem', display: 'flex', justifyContent: 'center' }}>
                            <Logo size={80} showText={false} />
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
                        <h2 className="text-center" style={{ marginBottom: '2rem' }}>{t('auth.register.title')}</h2>

                        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
                            <div className="form-group">
                                <label className="form-label">{t('auth.register.name')}</label>
                                <input
                                    {...register('name', {
                                        required: t('auth.register.nameRequired'),
                                        minLength: { value: 3, message: t('auth.register.nameMinLength') }
                                    })}
                                    type="text"
                                    className="form-input"
                                    placeholder={t('auth.register.namePlaceholder')}
                                    autoComplete="off"
                                />
                                {errors.name && <p className="error-msg">{errors.name.message as string}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('auth.register.email')}</label>
                                <input
                                    {...register('email', { required: t('auth.register.emailRequired') })}
                                    type="email"
                                    className="form-input"
                                    placeholder="name@example.com"
                                    autoComplete="off"
                                />
                                {errors.email && <p className="error-msg">{errors.email.message as string}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('auth.register.password')}</label>
                                <input
                                    {...register('password', { required: t('auth.register.passwordRequired'), minLength: { value: 6, message: t('auth.register.passwordMinLength') } })}
                                    type="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                />
                                {errors.password && <p className="error-msg">{errors.password.message as string}</p>}
                            </div>

                            {serverError && <p className="error-msg text-center">{serverError}</p>}

                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                <ReCAPTCHA
                                    ref={recaptchaRef}
                                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LdC5BgsAAAAADfzFZs2oQwCYzXen9QJwwiqfq-E"}
                                    onChange={() => setRecaptchaError('')}
                                    theme="dark"
                                />
                            </div>
                            {recaptchaError && <p className="error-msg text-center">{recaptchaError}</p>}

                            <Button type="submit" variant="primary" fullWidth>{t('auth.register.submit')}</Button>
                        </form>

                        <p className="text-center" style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
                            {t('auth.register.hasAccount')} <Link to="/login" className="link">{t('auth.register.signIn')}</Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
