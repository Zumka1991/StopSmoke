import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Book } from '../types/bookTypes';
import { booksService } from '../api/booksService';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';

export default function BooksPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const data = await booksService.getBooks();
            setBooks(data);
        } catch (err: any) {
            setError(t('books.errorLoading'));
            console.error('Failed to load books', err);
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

    return (
        <>
            <Navbar onLogout={handleLogout} />
            <div style={{ marginTop: '2rem', maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    color: 'var(--text-primary)',
                    fontWeight: 800,
                    letterSpacing: '-0.025em'
                }}>
                    {t('books.title')}
                </h1>
                <p style={{
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    marginBottom: '3rem',
                    fontSize: '1.1rem'
                }}>
                    {t('books.subtitle')}
                </p>

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
                        marginBottom: '1rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                {!loading && books.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem', maxWidth: 'none', width: '100%', background: 'rgba(30, 41, 59, 0.7)' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                            {t('books.noBooks')}
                        </p>
                    </div>
                )}

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '2.5rem', 
                    width: '100%' 
                }}>
                    {books.map((book) => (
                        <div
                            key={book.id}
                            className="card book-card"
                            style={{
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                width: '100%',
                                maxWidth: 'none',
                                padding: 0,
                                overflow: 'hidden',
                                background: 'rgba(30, 41, 59, 0.7)',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            onClick={() => navigate(`/books/${book.id}`)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)';
                                e.currentTarget.style.borderColor = 'var(--accent-color)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            }}
                        >
                            {/* Book Cover Preview */}
                            <div style={{
                                width: '100%',
                                aspectRatio: '2/3',
                                background: 'rgba(0,0,0,0.2)',
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                {book.coverImageUrl ? (
                                    <img 
                                        src={`${apiBaseUrl}${book.coverImageUrl}`} 
                                        alt={book.title}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.5s'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'rgba(255,255,255,0.1)',
                                        fontSize: '5rem'
                                    }}>
                                        📚
                                    </div>
                                )}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    padding: '1rem',
                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                    color: 'white'
                                }}>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '0.25rem' }}>{book.author}</div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>{book.title}</div>
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    marginBottom: '1.5rem',
                                    lineHeight: 1.5,
                                    fontSize: '0.95rem',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    flex: 1
                                }}>
                                    {book.description}
                                </p>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingTop: '1rem',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                                }}>
                                    <span style={{ 
                                        color: 'var(--accent-color)', 
                                        fontWeight: 600, 
                                        fontSize: '0.9rem' 
                                    }}>
                                        {t('books.details')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
