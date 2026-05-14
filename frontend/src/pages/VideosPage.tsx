import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import type { Video } from '../types/videoTypes';
import { videosService } from '../api/videosService';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';

export default function VideosPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            setLoading(true);
            const data = await videosService.getVideos();
            setVideos(data);
        } catch (err: any) {
            setError(t('videos.errorLoading'));
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

    const apiBaseUrl = import.meta.env.VITE_API_URL || '';

    return (
        <>
            <Helmet>
                <title>{t('titles.videos')}</title>
            </Helmet>
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
                    {t('videos.title')}
                </h1>
                <p style={{
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    marginBottom: '3rem',
                    fontSize: '1.1rem'
                }}>
                    {t('videos.subtitle')}
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

                {!loading && videos.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem', maxWidth: 'none', width: '100%', background: 'rgba(30, 41, 59, 0.7)' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                            {t('videos.noVideos')}
                        </p>
                    </div>
                )}

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                    gap: '2rem', 
                    width: '100%' 
                }}>
                    {videos.map((video) => (
                        <div
                            key={video.id}
                            className="card"
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
                            onClick={() => navigate(`/videos/${video.id}`)}
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
                            {/* Thumbnail Preview */}
                            <div style={{
                                width: '100%',
                                aspectRatio: '16/9',
                                background: 'rgba(0,0,0,0.2)',
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                {video.thumbnailUrl ? (
                                    <img 
                                        src={video.thumbnailUrl.startsWith('http') ? video.thumbnailUrl : `${apiBaseUrl}${video.thumbnailUrl}`} 
                                        alt={video.title}
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
                                        🎬
                                    </div>
                                )}
                                {/* Play button overlay */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(0,0,0,0.2)',
                                    transition: 'background 0.3s'
                                }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.15)',
                                        backdropFilter: 'blur(4px)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        fontSize: '1.5rem'
                                    }}>
                                        ▶️
                                    </div>
                                </div>
                                {/* Platform badge */}
                                <div style={{
                                    position: 'absolute',
                                    top: '0.75rem',
                                    left: '0.75rem',
                                    background: 'rgba(0,0,0,0.6)',
                                    backdropFilter: 'blur(4px)',
                                    color: 'white',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}>
                                    {video.platform}
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{
                                    margin: 0,
                                    marginBottom: '0.5rem',
                                    color: 'var(--text-primary)',
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    lineHeight: 1.3
                                }}>
                                    {video.title}
                                </h3>
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    marginBottom: '1.5rem',
                                    lineHeight: 1.5,
                                    fontSize: '0.9rem',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    flex: 1
                                }}>
                                    {video.description}
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
                                        {t('videos.watch')}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                        {new Date(video.createdAt).toLocaleDateString()}
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
