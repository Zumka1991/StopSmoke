import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Book } from '../types/bookTypes';
import { booksService } from '../api/booksService';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import FB2Reader from '../components/FB2Reader';

export default function BookDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showReader, setShowReader] = useState(false);

    useEffect(() => {
        if (id) {
            fetchBook(parseInt(id));
        }
    }, [id]);

    const fetchBook = async (bookId: number) => {
        try {
            setLoading(true);
            const data = await booksService.getBook(bookId);
            setBook(data);
        } catch (err: any) {
            setError(t('books.errorLoadingBook'));
            console.error('Failed to load book', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        navigate('/login');
    };

    const apiBaseUrl = import.meta.env.VITE_API_URL || '';

    if (loading) return (
        <>
            <Navbar onLogout={handleLogout} />
            <div style={{ textAlign: 'center', padding: '5rem' }}><LoadingSpinner /></div>
        </>
    );

    if (error || !book) return (
        <>
            <Navbar onLogout={handleLogout} />
            <div style={{ maxWidth: '800px', margin: '5rem auto', textAlign: 'center' }}>
                <div style={{ color: '#ef4444', marginBottom: '1.5rem' }}>{error || 'Книга не найдена'}</div>
                <button 
                    onClick={() => navigate('/books')}
                    className="btn btn-secondary"
                >
                    {t('common.back')}
                </button>
            </div>
        </>
    );

    return (
        <>
            <Navbar onLogout={handleLogout} />
            <div style={{ maxWidth: '1000px', margin: '3rem auto', padding: '0 2rem' }}>
                <button 
                    onClick={() => navigate('/books')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '1rem'
                    }}
                >
                    ← {t('common.back')}
                </button>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'minmax(250px, 1fr) 2fr', 
                    gap: '3rem',
                    marginBottom: '4rem'
                }} className="book-detail-grid">
                    {/* Book Cover */}
                    <div style={{ 
                        width: '100%', 
                        aspectRatio: '2/3', 
                        borderRadius: '0.75rem', 
                        overflow: 'hidden',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
                        background: 'rgba(30, 41, 59, 0.7)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        {book.coverImageUrl ? (
                            <img 
                                src={`${apiBaseUrl}${book.coverImageUrl}`} 
                                alt={book.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <div style={{ 
                                width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' 
                            }}>
                                📚
                            </div>
                        )}
                    </div>

                    {/* Book Info */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h1 style={{ 
                            fontSize: '2.5rem', 
                            fontWeight: 800, 
                            color: 'var(--text-primary)', 
                            marginBottom: '0.5rem' 
                        }}>
                            {book.title}
                        </h1>
                        <h2 style={{ 
                            fontSize: '1.5rem', 
                            color: 'var(--accent-color)', 
                            fontWeight: 600, 
                            marginBottom: '2rem' 
                        }}>
                            {book.author}
                        </h2>

                        <div style={{ 
                            background: 'rgba(255,255,255,0.03)', 
                            padding: '1.5rem', 
                            borderRadius: '0.75rem',
                            lineHeight: 1.7,
                            color: 'var(--text-secondary)',
                            fontSize: '1.05rem',
                            marginBottom: '2.5rem',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {book.description}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                            {book.fb2FragmentUrl && (
                                <>
                                    <button 
                                        onClick={() => setShowReader(!showReader)}
                                        className="btn btn-primary"
                                        style={{ flex: 1, minWidth: '180px' }}
                                    >
                                        📖 {showReader ? t('books.closeReader') : t('books.readFragment')}
                                    </button>
                                    <a 
                                        href={`${apiBaseUrl}${book.fb2FragmentUrl}`}
                                        download
                                        className="btn btn-secondary"
                                        style={{ 
                                            flex: 1, 
                                            minWidth: '180px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            textDecoration: 'none',
                                            padding: '0.75rem 1.5rem',
                                            color: '#f8fafc',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '0.5rem',
                                            fontWeight: 600
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                        }}
                                    >
                                        📥 {t('books.downloadFb2')}
                                    </a>
                                </>
                            )}
                            {book.externalUrl && (
                                <a 
                                    href={book.externalUrl.trim().startsWith('http') ? book.externalUrl.trim() : `https://${book.externalUrl.trim()}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary"
                                    style={{ 
                                        flex: 1, 
                                        minWidth: '180px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        background: 'rgba(239, 137, 13, 0.15)',
                                        borderColor: 'rgba(239, 137, 13, 0.3)',
                                        color: '#ef890d',
                                        textDecoration: 'none'
                                    }}
                                >
                                    🛒 {t('books.buyOnLitres')}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* FB2 Reader Fragment */}
                {showReader && book.fb2FragmentUrl && (
                    <div style={{ marginTop: '3rem', width: '100%' }}>
                        <h3 style={{ 
                            color: 'var(--text-primary)', 
                            marginBottom: '1.5rem', 
                            fontSize: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}>
                            <span>📖</span> {t('books.fragmentTitle')}
                        </h3>
                        <FB2Reader fileUrl={`${apiBaseUrl}${book.fb2FragmentUrl}`} />
                    </div>
                )}
            </div>
            
            <style>{`
                @media (max-width: 768px) {
                    .book-detail-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .book-detail-grid div:first-child {
                        max-width: 250px;
                        margin: 0 auto;
                    }
                }
            `}</style>
        </>
    );
}
