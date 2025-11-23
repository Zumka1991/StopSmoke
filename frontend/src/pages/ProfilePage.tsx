import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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

                setValue('quitDate', data.quitDate ? data.quitDate.split('T')[0] : '');
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
            await api.put('/profile', {
                quitDate: data.quitDate || null,
                cigarettesPerDay: parseInt(data.cigarettesPerDay),
                pricePerPack: parseFloat(data.pricePerPack),
                currency: data.currency
            });
            setSuccessMsg(t('profile.updateSuccess'));
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setErrorMsg(t('profile.updateError'));
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
            <LanguageSwitcher />
            <div className="container" style={{ maxWidth: '600px', marginTop: '3rem' }}>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2>{t('profile.title')}</h2>
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

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="form-group">
                            <label className="form-label">{t('profile.quitDate')}</label>
                            <input
                                {...register('quitDate')}
                                type="date"
                                className="form-input"
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
