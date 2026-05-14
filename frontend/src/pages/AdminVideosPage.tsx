import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import type { Video, CreateVideoRequest } from '../types/videoTypes';
import { videosService } from '../api/videosService';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';

export default function AdminVideosPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<CreateVideoRequest>({
        title: '',
        description: '',
        videoUrl: '',
        thumbnailUrl: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            setLoading(true);
            const data = await videosService.getVideos();
            setVideos(data);
        } catch (err: any) {
            setError('Ошибка загрузки видео. Убедитесь, что у вас есть права администратора.');
            console.error('Failed to load videos', err);
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
        setFormData({ title: '', description: '', videoUrl: '', thumbnailUrl: '' });
        setShowForm(true);
    };

    const handleEdit = (video: Video) => {
        setEditingId(video.id);
        setFormData({
            title: video.title,
            description: video.description,
            videoUrl: video.videoUrl,
            thumbnailUrl: video.thumbnailUrl || ''
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            if (editingId) {
                await videosService.updateVideo(editingId, formData);
            } else {
                await videosService.createVideo(formData);
            }
            setShowForm(false);
            fetchVideos();
        } catch (err: any) {
            setError('Ошибка при сохранении видео.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Вы уверены, что хотите удалить это видео?')) return;

        try {
            await videosService.deleteVideo(id);
            fetchVideos();
        } catch (err) {
            setError('Ошибка при удалении видео.');
        }
    };

    return (
        <>
            <Helmet>
                <title>{t('titles.adminVideos')}</title>
            </Helmet>
            <Navbar onLogout={handleLogout} />
            <div style={{ marginTop: '2rem', maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>Управление видео</h1>
                    {!showForm && <Button onClick={handleCreate} variant="primary">+ Добавить видео</Button>}
                </div>

                {error && (
                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#ef4444', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                {showForm && (
                    <div className="card" style={{ marginBottom: '2rem', maxWidth: '800px' }}>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>{editingId ? 'Редактировать' : 'Новое видео'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Название</label>
                                <input type="text" className="form-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Описание</label>
                                <textarea className="form-input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required rows={5} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ссылка на видео (YouTube / RuTube)</label>
                                <input type="url" className="form-input" value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} required placeholder="https://..." />
                            </div>
                            <div className="form-group">
                                <label className="form-label">URL превью (необязательно)</label>
                                <input type="url" className="form-input" value={formData.thumbnailUrl} onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })} placeholder="https://..." />
                                <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Для YouTube превью генерируется автоматически</small>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
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
                        {videos.map(video => (
                            <div key={video.id} className="card" style={{ maxWidth: 'none', display: 'flex', gap: '1.5rem', alignItems: 'center', padding: '1rem' }}>
                                <div style={{ width: '120px', height: '68px', background: 'rgba(0,0,0,0.2)', borderRadius: '0.25rem', overflow: 'hidden', flexShrink: 0 }}>
                                    {video.thumbnailUrl ? (
                                        <img 
                                            src={video.thumbnailUrl.startsWith('http') ? video.thumbnailUrl : `${import.meta.env.VITE_API_URL || ''}${video.thumbnailUrl}`} 
                                            alt="" 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎬</div>
                                    )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{video.title}</h3>
                                    <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{video.description}</p>
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                        <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-color)', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>
                                            {video.platform}
                                        </span>
                                        <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            🔗 Ссылка
                                        </a>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                    <Button size="sm" variant="outline" onClick={() => handleEdit(video)}>✏️</Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(video.id)}>🗑️</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
