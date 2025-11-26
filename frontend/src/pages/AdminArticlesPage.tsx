import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';

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

interface ArticleFormData {
    title: string;
    content: string;
    summary: string;
    isPublished: boolean;
}

export default function AdminArticlesPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<ArticleFormData>({
        title: '',
        content: '',
        summary: '',
        isPublished: false
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const response = await api.get('/articles/admin/all');
            setArticles(response.data);
        } catch (err: any) {
            if (err.response?.status === 403) {
                setError(t('articles.noAdminAccess'));
            } else {
                setError(t('articles.errorLoading'));
            }
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

    const handleCreate = () => {
        setEditingId(null);
        setFormData({
            title: '',
            content: '',
            summary: '',
            isPublished: false
        });
        setShowForm(true);
    };

    const handleEdit = (article: Article) => {
        setEditingId(article.id);
        setFormData({
            title: article.title,
            content: article.content,
            summary: article.summary || '',
            isPublished: article.isPublished
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            if (editingId) {
                await api.put(`/articles/${editingId}`, formData);
            } else {
                await api.post('/articles', formData);
            }
            setShowForm(false);
            fetchArticles();
        } catch (err: any) {
            setError(err.response?.data || t('articles.errorSaving'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('articles.confirmDelete'))) return;

        try {
            await api.delete(`/articles/${id}`);
            fetchArticles();
        } catch (err: any) {
            setError(t('articles.errorDeleting'));
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <>
            <Navbar onLogout={handleLogout} />
            <div style={{ marginTop: '2rem', maxWidth: '1600px', margin: '2rem auto', padding: '0 2rem' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem'
                }}>
                    <h1 style={{
                        fontSize: '2rem',
                        color: 'var(--text-primary)'
                    }}>
                        {t('articles.adminTitle')}
                    </h1>

                    <Button
                        onClick={handleCreate}
                        variant="primary"
                        style={{
                            display: showForm ? 'none' : 'block'
                        }}
                    >
                        + {t('articles.createNew')}
                    </Button>
                </div>

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

                {showForm && (
                    <div className="card" style={{ marginBottom: '2rem', maxWidth: '800px' }}>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>
                            {editingId ? t('articles.editArticle') : t('articles.createArticle')}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">{t('articles.titleLabel')}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    maxLength={200}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('articles.summaryLabel')}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.summary}
                                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                    maxLength={500}
                                    placeholder={t('articles.summaryPlaceholder')}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('articles.contentLabel')}</label>
                                <textarea
                                    className="form-input"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    required
                                    rows={12}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isPublished}
                                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                        style={{ width: 'auto' }}
                                    />
                                    <span>{t('articles.publishLabel')}</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={submitting}
                                    loading={submitting}
                                >
                                    {submitting ? t('articles.saving') : t('articles.save')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="danger"
                                    onClick={() => setShowForm(false)}
                                >
                                    {t('articles.cancel')}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {loading && (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <LoadingSpinner />
                    </div>
                )}

                {!loading && articles.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem', maxWidth: 'none' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                            {t('articles.noArticles')}
                        </p>
                    </div>
                )}

                {!loading && articles.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {articles.map((article) => (
                            <div key={article.id} className="card" style={{
                                border: `2px solid ${article.isPublished ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                maxWidth: 'none'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'start',
                                    marginBottom: '1rem'
                                }}>
                                    <h3 style={{
                                        fontSize: '1.25rem',
                                        color: 'var(--text-primary)',
                                        marginBottom: '0.5rem',
                                        flex: 1
                                    }}>
                                        {article.title}
                                    </h3>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        background: article.isPublished ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                        color: article.isPublished ? '#22c55e' : '#ef4444'
                                    }}>
                                        {article.isPublished ? t('articles.published') : t('articles.draft')}
                                    </span>
                                </div>

                                {article.summary && (
                                    <p style={{
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.9rem',
                                        marginBottom: '1rem'
                                    }}>
                                        {article.summary.substring(0, 100)}
                                        {article.summary.length > 100 ? '...' : ''}
                                    </p>
                                )}

                                <div style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '1rem'
                                }}>
                                    {formatDate(article.createdAt)}
                                    {article.authorName && ` • ${article.authorName}`}
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <Button
                                        onClick={() => handleEdit(article)}
                                        variant="outline"
                                        size="sm"
                                        style={{ flex: '1 1 120px', minWidth: '120px' }}
                                    >
                                        {t('articles.edit')}
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(article.id)}
                                        variant="danger"
                                        size="sm"
                                        style={{ flex: '1 1 100px', minWidth: '100px' }}
                                    >
                                        {t('articles.delete')}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
