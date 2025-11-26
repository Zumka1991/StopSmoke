import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';

interface Article {
    id: number;
    title: string;
    content: string;
    summary?: string;
    createdAt: string;
    updatedAt?: string;
    isPublished: boolean;
    authorName?: string;
}

export default function ArticlesPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const response = await api.get('/articles');
            setArticles(response.data);
        } catch (err: any) {
            setError(t('articles.errorLoading'));
            console.error('Failed to load articles', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        navigate('/login');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <>
            <Navbar onLogout={handleLogout} />
            <div style={{ marginTop: '2rem', maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' }}>
                <h1 style={{
                    fontSize: '2rem',
                    marginBottom: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-primary)'
                }}>
                    {t('articles.title')}
                </h1>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <LoadingSpinner />
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '0.5rem',
                        color: '#ef4444',
                        marginBottom: '1rem'
                    }}>
                        {error}
                    </div>
                )}

                {!loading && articles.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem', maxWidth: 'none', width: '100%' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                            {t('articles.noArticles')}
                        </p>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                    {articles.map((article) => (
                        <div
                            key={article.id}
                            className="card"
                            style={{
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                border: '2px solid rgba(59, 130, 246, 0.2)',
                                width: '100%',
                                maxWidth: 'none'
                            }}
                            onClick={() => navigate(`/articles/${article.id}`)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
                                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '';
                                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                            }}
                        >
                            <h2 style={{
                                fontSize: '1.5rem',
                                marginBottom: '0.75rem',
                                color: 'var(--accent-color)'
                            }}>
                                {article.title}
                            </h2>

                            {article.summary && (
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    marginBottom: '1rem',
                                    lineHeight: 1.6
                                }}>
                                    {article.summary}
                                </p>
                            )}

                            <div style={{
                                display: 'flex',
                                gap: '1rem',
                                fontSize: '0.875rem',
                                color: 'var(--text-secondary)',
                                marginTop: '1rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                <span>{formatDate(article.createdAt)}</span>
                                {article.authorName && (
                                    <>
                                        <span>•</span>
                                        <span>{article.authorName}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
