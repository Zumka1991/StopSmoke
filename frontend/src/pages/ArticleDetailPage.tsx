import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

export default function ArticleDetailPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            fetchArticle();
        }
    }, [id]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/articles/${id}`);
            setArticle(response.data);
        } catch (err: any) {
            setError(t('articles.errorLoadingArticle'));
            console.error('Failed to load article', err);
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
            <div style={{ marginTop: '2rem', maxWidth: '1000px', margin: '2rem auto', padding: '0 2rem' }}>
                <button
                    onClick={() => navigate('/articles')}
                    className="btn"
                    style={{
                        marginBottom: '1.5rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '2px solid rgba(59, 130, 246, 0.3)',
                        color: 'var(--accent-color)'
                    }}
                >
                    ← {t('articles.backToList')}
                </button>

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

                {article && (
                    <div className="card" style={{ maxWidth: 'none' }}>
                        <h1 style={{
                            fontSize: '2rem',
                            marginBottom: '1rem',
                            color: 'var(--text-primary)',
                            lineHeight: 1.3
                        }}>
                            {article.title}
                        </h1>

                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '2rem',
                            paddingBottom: '1rem',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <span>{formatDate(article.createdAt)}</span>
                            {article.authorName && (
                                <>
                                    <span>•</span>
                                    <span>{article.authorName}</span>
                                </>
                            )}
                            {article.updatedAt && (
                                <>
                                    <span>•</span>
                                    <span>{t('articles.updated')}: {formatDate(article.updatedAt)}</span>
                                </>
                            )}
                        </div>

                        <div style={{
                            color: 'var(--text-primary)',
                            lineHeight: 1.8,
                            fontSize: '1.05rem'
                        }}>
                            {article.content.split('\n').map((paragraph, index) => (
                                <p key={index} style={{ marginBottom: '1rem' }}>
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
