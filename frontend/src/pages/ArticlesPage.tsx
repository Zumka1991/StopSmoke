import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

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

interface PaginatedResponse {
    items: Article[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

export default function ArticlesPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        fetchArticles(currentPage);
    }, [currentPage]);

    const fetchArticles = async (page: number) => {
        try {
            setLoading(true);
            const response = await api.get<PaginatedResponse>(`/articles?page=${page}&pageSize=${pageSize}`);
            setArticles(response.data.items);
            setTotalPages(response.data.totalPages);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            setError(t('articles.errorLoading'));
            console.error('Failed to load articles', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
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
            <div style={{ marginTop: '2rem', maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    marginBottom: '3rem',
                    textAlign: 'center',
                    color: 'var(--text-primary)',
                    fontWeight: 800,
                    letterSpacing: '-0.025em'
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', width: '100%' }}>
                    {articles.map((article) => (
                        <div
                            key={article.id}
                            className="card article-card"
                            style={{
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                width: '100%',
                                maxWidth: 'none',
                                padding: 0,
                                overflow: 'hidden',
                                background: 'rgba(30, 41, 59, 0.7)',
                                backdropFilter: 'blur(10px)'
                            }}
                            onClick={() => navigate(`/articles/${article.id}`)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)';
                                e.currentTarget.style.borderColor = 'var(--accent-color)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            }}
                        >
                            {/* Article Image Preview */}
                            <div className="article-card-image-wrapper">
                                {article.imageUrl ? (
                                    <img 
                                        src={`${apiBaseUrl}${article.imageUrl}`} 
                                        alt={article.title}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.5s'
                                        }}
                                        className="article-image-hover"
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'rgba(255,255,255,0.2)',
                                        fontSize: '4rem'
                                    }}>
                                        📄
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h2 style={{
                                    fontSize: '1.75rem',
                                    marginBottom: '1rem',
                                    color: 'var(--text-primary)',
                                    fontWeight: 700,
                                    lineHeight: 1.2
                                }}>
                                    {article.title}
                                </h2>

                                {article.summary && (
                                    <p style={{
                                        color: 'var(--text-secondary)',
                                        marginBottom: '1.5rem',
                                        lineHeight: 1.6,
                                        fontSize: '1.05rem',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {article.summary}
                                    </p>
                                )}

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: 'auto',
                                    paddingTop: '1.5rem',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                    fontSize: '0.875rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <span>{formatDate(article.createdAt)}</span>
                                        {article.authorName && (
                                            <>
                                                <span style={{ opacity: 0.3 }}>|</span>
                                                <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{article.authorName}</span>
                                            </>
                                        )}
                                    </div>
                                    <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{t('articles.readMore') || 'Read More →'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {!loading && articles.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>
        </>
    );
}
