import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Book, CreateBookRequest } from '../types/bookTypes';
import { booksService } from '../api/booksService';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';

export default function AdminBooksPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<CreateBookRequest>({
        title: '',
        author: '',
        description: '',
        externalUrl: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingFb2, setUploadingFb2] = useState(false);
    const [selectedCover, setSelectedCover] = useState<File | null>(null);
    const [selectedFb2, setSelectedFb2] = useState<File | null>(null);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const data = await booksService.getBooks();
            setBooks(data);
        } catch (err: any) {
            setError('Ошибка загрузки книг. Убедитесь, что у вас есть права администратора.');
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

    const handleCreate = () => {
        setEditingId(null);
        setFormData({ title: '', author: '', description: '', externalUrl: '' });
        setSelectedCover(null);
        setSelectedFb2(null);
        setShowForm(true);
    };

    const handleEdit = (book: Book) => {
        setEditingId(book.id);
        setFormData({
            title: book.title,
            author: book.author,
            description: book.description,
            externalUrl: book.externalUrl || ''
        });
        setSelectedCover(null);
        setSelectedFb2(null);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            if (editingId) {
                await booksService.updateBook(editingId, formData);
                if (selectedCover) await booksService.uploadCover(editingId, selectedCover);
                if (selectedFb2) await booksService.uploadFb2(editingId, selectedFb2);
            } else {
                const book = await booksService.createBook(formData);
                if (selectedCover) await booksService.uploadCover(book.id, selectedCover);
                if (selectedFb2) await booksService.uploadFb2(book.id, selectedFb2);
            }
            setShowForm(false);
            fetchBooks();
        } catch (err: any) {
            setError('Ошибка при сохранении книги.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>, bookId: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingCover(true);
            await booksService.uploadCover(bookId, file);
            fetchBooks();
        } catch (err) {
            setError('Ошибка при загрузке обложки.');
        } finally {
            setUploadingCover(false);
        }
    };

    const handleFb2Upload = async (e: React.ChangeEvent<HTMLInputElement>, bookId: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingFb2(true);
            await booksService.uploadFb2(bookId, file);
            fetchBooks();
        } catch (err) {
            setError('Ошибка при загрузке FB2 файла.');
        } finally {
            setUploadingFb2(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Вы уверены, что хотите удалить эту книгу?')) return;

        try {
            await booksService.deleteBook(id);
            fetchBooks();
        } catch (err) {
            setError('Ошибка при удалении книги.');
        }
    };

    const apiBaseUrl = import.meta.env.VITE_API_URL || '';

    return (
        <>
            <Navbar onLogout={handleLogout} />
            <div style={{ marginTop: '2rem', maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>Управление книгами</h1>
                    {!showForm && <Button onClick={handleCreate} variant="primary">+ Добавить книгу</Button>}
                </div>

                {error && (
                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#ef4444', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                {showForm && (
                    <div className="card" style={{ marginBottom: '2rem', maxWidth: '800px' }}>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>{editingId ? 'Редактировать' : 'Новая книга'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Название</label>
                                <input type="text" className="form-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Автор</label>
                                <input type="text" className="form-input" value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Описание</label>
                                <textarea className="form-input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required rows={5} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ссылка на ЛитРес (необязательно)</label>
                                <input type="text" className="form-input" value={formData.externalUrl} onChange={e => setFormData({ ...formData, externalUrl: e.target.value })} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Обложка (JPG/PNG)</label>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={e => setSelectedCover(e.target.files?.[0] || null)}
                                        className="form-input"
                                        style={{ padding: '0.4rem' }}
                                    />
                                    {selectedCover && <div style={{ fontSize: '0.8rem', color: 'var(--accent-color)', marginTop: '0.2rem' }}>📎 {selectedCover.name}</div>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Файл фрагмента (FB2)</label>
                                    <input 
                                        type="file" 
                                        accept=".fb2" 
                                        onChange={e => setSelectedFb2(e.target.files?.[0] || null)}
                                        className="form-input"
                                        style={{ padding: '0.4rem' }}
                                    />
                                    {selectedFb2 && <div style={{ fontSize: '0.8rem', color: 'var(--accent-color)', marginTop: '0.2rem' }}>📎 {selectedFb2.name}</div>}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Сохранение...' : 'Сохранить'}</Button>
                                <Button type="button" variant="danger" onClick={() => setShowForm(false)}>Отмена</Button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}><LoadingSpinner /></div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {books.map(book => (
                            <div key={book.id} className="card" style={{ maxWidth: 'none', display: 'flex', gap: '1.5rem', alignItems: 'center', padding: '1rem' }}>
                                <div style={{ width: '80px', height: '120px', background: 'rgba(0,0,0,0.2)', borderRadius: '0.25rem', overflow: 'hidden' }}>
                                    {book.coverImageUrl && <img src={`${apiBaseUrl}${book.coverImageUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{book.title}</h3>
                                    <p style={{ margin: '0.25rem 0', color: 'var(--accent-color)' }}>{book.author}</p>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input type="file" id={`cover-${book.id}`} style={{ display: 'none' }} accept="image/*" onChange={e => handleCoverUpload(e, book.id)} />
                                            <label htmlFor={`cover-${book.id}`} style={{ fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                                {uploadingCover ? '...' : '🖼️ Обложка'}
                                            </label>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input type="file" id={`fb2-${book.id}`} style={{ display: 'none' }} accept=".fb2" onChange={e => handleFb2Upload(e, book.id)} />
                                            <label htmlFor={`fb2-${book.id}`} style={{ fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                                {uploadingFb2 ? '...' : '📄 FB2 фрагмент'}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Button size="sm" variant="outline" onClick={() => handleEdit(book)}>✏️</Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(book.id)}>🗑️</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
