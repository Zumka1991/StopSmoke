import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import Pagination from './Pagination';

interface Comment {
    id: number;
    content: string;
    createdAt: string;
    articleId: number;
    userId: string;
    userName: string;
    isAuthor: boolean;
}

interface PaginatedResponse {
    items: Comment[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

interface CommentsProps {
    articleId: number;
}

export default function Comments({ articleId }: CommentsProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;
    const isAuthenticated = !!localStorage.getItem('token');

    useEffect(() => {
        fetchComments(currentPage);
    }, [articleId, currentPage]);

    const fetchComments = async (page: number) => {
        try {
            setLoading(true);
            const response = await api.get<PaginatedResponse>(`/articles/${articleId}/comments?page=${page}&pageSize=${pageSize}`);
            setComments(response.data.items);
            setTotalPages(response.data.totalPages);
            setTotalCount(response.data.totalCount);
        } catch (err) {
            console.error('Failed to load comments', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Scroll to comments section
        document.querySelector('h2')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        setError('');

        try {
            await api.post(`/articles/${articleId}/comments`, {
                content: newComment
            });
            setNewComment('');
            // Reset to first page to show new comment
            setCurrentPage(1);
            await fetchComments(1);
        } catch (err: any) {
            setError(err.response?.data || t('comments.errorSubmit'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId: number) => {
        if (!confirm(t('comments.confirmDelete'))) return;

        try {
            await api.delete(`/articles/${articleId}/comments/${commentId}`);
            // Stay on current page or go to previous if current becomes empty
            const newTotalCount = totalCount - 1;
            const newTotalPages = Math.ceil(newTotalCount / pageSize);
            const targetPage = currentPage > newTotalPages ? newTotalPages : currentPage;
            setCurrentPage(targetPage > 0 ? targetPage : 1);
            await fetchComments(targetPage > 0 ? targetPage : 1);
        } catch (err) {
            console.error('Failed to delete comment', err);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div style={{ marginTop: '3rem', width: '100%' }}>
            <h2 style={{
                fontSize: '1.5rem',
                marginBottom: '1.5rem',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                💬 {t('comments.title')} ({totalCount})
            </h2>

            {/* Comment Form */}
            {isAuthenticated ? (
                <div className="card" style={{ marginBottom: '2rem', maxWidth: 'none', width: '100%' }}>
                    <form onSubmit={handleSubmit}>
                        <textarea
                            className="form-input"
                            rows={3}
                            placeholder={t('comments.placeholder')}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            maxLength={1000}
                            style={{ resize: 'vertical', minHeight: '80px' }}
                        />
                        {error && (
                            <p style={{
                                color: 'var(--error-color)',
                                fontSize: '0.875rem',
                                marginTop: '0.5rem'
                            }}>
                                {error}
                            </p>
                        )}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '1rem'
                        }}>
                            <span style={{
                                fontSize: '0.875rem',
                                color: 'var(--text-secondary)'
                            }}>
                                {newComment.length}/1000
                            </span>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={!newComment.trim() || submitting}
                                loading={submitting}
                            >
                                {t('comments.submit')}
                            </Button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="card" style={{
                    marginBottom: '2rem',
                    textAlign: 'center',
                    padding: '2rem',
                    maxWidth: 'none',
                    width: '100%'
                }}>
                    <p style={{
                        color: 'var(--text-secondary)',
                        marginBottom: '1rem'
                    }}>
                        {t('comments.loginRequired')}
                    </p>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/login')}
                    >
                        {t('landing.hero.login')}
                    </Button>
                </div>
            )}

            {/* Comments List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <LoadingSpinner />
                </div>
            ) : comments.length === 0 ? (
                <div className="card" style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'var(--text-secondary)',
                    maxWidth: 'none',
                    width: '100%'
                }}>
                    {t('comments.empty')}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    {comments.map((comment) => (
                        <div
                            key={comment.id}
                            className="card"
                            style={{
                                border: comment.isAuthor
                                    ? '1px solid rgba(59, 130, 246, 0.3)'
                                    : '1px solid rgba(255, 255, 255, 0.1)',
                                maxWidth: 'none',
                                width: '100%'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '0.75rem'
                            }}>
                                <div>
                                    <div style={{
                                        fontWeight: '600',
                                        color: comment.isAuthor
                                            ? 'var(--accent-color)'
                                            : 'var(--text-primary)',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {comment.userName}
                                        {comment.isAuthor && (
                                            <span style={{
                                                marginLeft: '0.5rem',
                                                fontSize: '0.75rem',
                                                color: 'var(--accent-color)',
                                                fontWeight: '500'
                                            }}>
                                                ({t('comments.you')})
                                            </span>
                                        )}
                                    </div>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        {formatDate(comment.createdAt)}
                                    </div>
                                </div>
                                {comment.isAuthor && (
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--error-color)',
                                            cursor: 'pointer',
                                            padding: '0.25rem 0.5rem',
                                            fontSize: '0.875rem',
                                            borderRadius: '0.25rem',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        {t('comments.delete')}
                                    </button>
                                )}
                            </div>
                            <p style={{
                                color: 'var(--text-primary)',
                                lineHeight: '1.6',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}>
                                {comment.content}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && comments.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
}
