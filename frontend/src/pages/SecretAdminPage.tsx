import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SecretAdminPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Секретный код
        if (code !== 'admin2025') {
            setError('Неверный код доступа');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/admin/grant-access');
            setSuccess(true);
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data || 'Ошибка при получении прав администратора');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <>
                <Helmet>
                    <title>{t('titles.adminAccessGranted')}</title>
                </Helmet>
                <div className="auth-container">
                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                        <h2 style={{ marginBottom: '1rem' }}>Права администратора получены!</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Перенаправление на главную...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Helmet>
                <title>{t('titles.adminAccess')}</title>
            </Helmet>
            <div className="auth-container">
            <div className="card">
                <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>🔐 Секретный доступ</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Код доступа</label>
                        <input
                            type="password"
                            className="form-input"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Введите секретный код"
                            required
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '0.5rem',
                            color: '#ef4444',
                            marginBottom: '1rem',
                            fontSize: '0.875rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%' }}
                    >
                        {loading ? <LoadingSpinner size="20px" /> : 'Получить права администратора'}
                    </button>
                </form>

                <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                }}>
                    ⚠️ Эта страница предназначена только только для разработки
                </div>
            </div>
        </div>
        </>
    );
}
