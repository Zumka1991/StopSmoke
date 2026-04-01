import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import Comments from '../components/Comments';

interface Article {
    id: number;
    title: string;
    content: string;
    summary?: string;
    imageUrl?: string;
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

    const apiBaseUrl = import.meta.env.VITE_API_URL || '';

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
                        color: 'var(--accent-color)',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontWeight: 600
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
                    <div className="card" style={{ maxWidth: 'none', padding: 0, overflow: 'hidden' }}>
                        {article.imageUrl && (
                            <div style={{
                                width: '100%',
                                height: '400px',
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                <img 
                                    src={`${apiBaseUrl}${article.imageUrl}`} 
                                    alt={article.title}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '50%',
                                    background: 'linear-gradient(to top, rgba(30, 41, 59, 0.9), transparent)'
                                }}></div>
                            </div>
                        )}
                        
                        <div style={{ padding: '2.5rem' }}>
                            <h1 style={{
                                fontSize: '2.5rem',
                                marginBottom: '1.5rem',
                                color: 'var(--text-primary)',
                                lineHeight: 1.2,
                                fontWeight: 800,
                                letterSpacing: '-0.02em'
                            }}>
                                {article.title}
                            </h1>

                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '1.5rem',
                                fontSize: '0.9rem',
                                color: 'var(--text-secondary)',
                                marginBottom: '2.5rem',
                                paddingBottom: '1.5rem',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>📅 {formatDate(article.createdAt)}</span>
                                </div>
                                {article.authorName && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>👤 {article.authorName}</span>
                                    </div>
                                )}
                                {article.updatedAt && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>🔄 {t('articles.updated')}: {formatDate(article.updatedAt)}</span>
                                    </div>
                                )}
                            </div>

                            <div style={{
                                lineHeight: 1.8,
                                fontSize: '1.15rem',
                                color: '#e2e8f0'
                            }}>
                                {article.content.split('\n').map((paragraph, index) => (
                                    paragraph.trim() && (
                                        <p key={index} style={{ marginBottom: '1.5rem' }}>
                                            {paragraph}
                                        </p>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Comments Section */}
                {article && <Comments articleId={article.id} />}
            </div>
        </>
    );
}
