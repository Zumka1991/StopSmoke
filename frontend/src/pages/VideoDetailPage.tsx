import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import type { Video } from '../types/videoTypes';
import { videosService } from '../api/videosService';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';

function getEmbedUrl(videoUrl: string, platform: string): string | null {
    if (platform === 'YouTube') {
        // youtu.be/ID
        let m = videoUrl.match(/youtu\.be\/([^?&/]+)/);
        if (m) return `https://www.youtube.com/embed/${m[1]}`;
        // youtube.com/watch?v=ID
        m = videoUrl.match(/[?&]v=([^?&/]+)/);
        if (m) return `https://www.youtube.com/embed/${m[1]}`;
        // youtube.com/embed/ID
        m = videoUrl.match(/youtube\.com\/embed\/([^?&/]+)/);
        if (m) return `https://www.youtube.com/embed/${m[1]}`;
    }
    if (platform === 'RuTube') {
        // rutube.ru/video/ID/
        let m = videoUrl.match(/rutube\.ru\/video\/([^?&/]+)/);
        if (m) return `https://rutube.ru/play/embed/${m[1]}`;
        // rutube.ru/play/embed/ID
        m = videoUrl.match(/rutube\.ru\/play\/embed\/([^?&/]+)/);
        if (m) return `https://rutube.ru/play/embed/${m[1]}`;
    }
    return null;
}

export default function VideoDetailPage() {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [video, setVideo] = useState<Video | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) fetchVideo(parseInt(id));
    }, [id]);

    const fetchVideo = async (videoId: number) => {
        try {
            setLoading(true);
            const data = await videosService.getVideo(videoId);
            setVideo(data);
        } catch (err: any) {
            setError(t('videos.errorLoadingVideo'));
            console.error('Failed to load video', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        navigate('/login');
    };

    const embedUrl = video ? getEmbedUrl(video.videoUrl, video.platform) : null;

    return (
        <>
            <Helmet>
                <title>{video ? `${video.title} - StopSmoke` : t('titles.videoDetail')}</title>
            </Helmet>
            <Navbar onLogout={handleLogout} />
            <div style={{ marginTop: '2rem', maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
                <Button variant="outline" onClick={() => navigate('/videos')} style={{ marginBottom: '1.5rem' }}>
                    ← {t('common.back')}
                </Button>

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

                {video && (
                    <div>
                        <h1 style={{
                            fontSize: '2rem',
                            marginBottom: '1rem',
                            color: 'var(--text-primary)',
                            fontWeight: 800,
                            letterSpacing: '-0.025em'
                        }}>
                            {video.title}
                        </h1>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '1.5rem',
                            color: 'var(--text-secondary)',
                            fontSize: '0.9rem'
                        }}>
                            <span style={{
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: 'var(--accent-color)',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '0.25rem',
                                fontWeight: 600,
                                fontSize: '0.75rem'
                            }}>
                                {video.platform}
                            </span>
                            <span>•</span>
                            <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Video Player */}
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            paddingBottom: '56.25%', // 16:9
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '0.75rem',
                            overflow: 'hidden',
                            marginBottom: '2rem',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            {embedUrl ? (
                                <iframe
                                    src={embedUrl}
                                    title={video.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        border: 'none'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    <span style={{ fontSize: '3rem' }}>🎬</span>
                                    <p>{t('videos.unsupportedPlatform')}</p>
                                    <a
                                        href={video.videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            color: 'var(--accent-color)',
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        {t('videos.openOnPlatform')}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="card" style={{ maxWidth: 'none', background: 'rgba(30, 41, 59, 0.7)' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--accent-color)' }}>
                                {t('videos.description')}
                            </h2>
                            <p style={{
                                color: 'var(--text-secondary)',
                                lineHeight: 1.7,
                                fontSize: '1rem',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {video.description}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
