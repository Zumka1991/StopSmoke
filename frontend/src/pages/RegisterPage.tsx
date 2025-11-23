import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function RegisterPage() {
    const { t } = useTranslation();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [serverError, setServerError] = useState('');
    const navigate = useNavigate();

    const onSubmit = async (data: any) => {
        try {
            await api.post('/auth/register', data);
            navigate('/login');
        } catch (err: any) {
            if (err.response?.data?.errors) {
                const errorMessages = err.response.data.errors.map((e: any) => e.description).join(', ');
                setServerError(errorMessages);
            } else {
                setServerError(err.response?.data?.message || t('auth.register.error'));
            }
        }
    };

    return (
        <>
            <LanguageSwitcher />
            <div className="auth-container">
                <div className="card">
                    <h2 className="text-center" style={{ marginBottom: '2rem' }}>{t('auth.register.title')}</h2>

                    <form onSubmit={handleSubmit(onSubmit)}>
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
                            />
                            {errors.password && <p className="error-msg">{errors.password.message as string}</p>}
                        </div>

                        {serverError && <p className="error-msg text-center">{serverError}</p>}

                        <button type="submit" className="btn btn-primary">{t('auth.register.submit')}</button>
                    </form>

                    <p className="text-center" style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
                        {t('auth.register.hasAccount')} <Link to="/login" className="link">{t('auth.register.signIn')}</Link>
                    </p>
                </div>
            </div>
        </>
    );
}
