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
            <LanguageSwitcher />
            <div className="auth-container">
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
        </>
    );
}
