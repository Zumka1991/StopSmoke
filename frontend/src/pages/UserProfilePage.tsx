import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { Calendar, MessageCircle, Clock, Trophy, X } from 'lucide-react';
import Toast from '../components/Toast';

interface PublicProfile {
    id: string;
    name: string;
    email: string;
    quitDate: string | null;
    lastSeen: string | null;
    completedMarathonsCount: number;
    avatarUrl?: string;
    avatarThumbnailUrl?: string;
}

export default function UserProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [startingChat, setStartingChat] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get(`/profile/${id}`);
                setProfile(response.data);
            } catch (err) {
                console.error(err);
                setError(t('profile.loadError') || 'Profile loading error');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProfile();
        }
    }, [id, t]);

    const handleSendMessage = async () => {
        if (!profile) return;
        setStartingChat(true);
        try {
            await api.post('/messages/conversations', { 
                participantEmail: profile.email 
            });
            navigate('/messages');
        } catch (err) {
            console.error('Error starting chat', err);
            setToast({ message: t('messages.errorCreatingConversation'), type: 'error' });
        } finally {
            setStartingChat(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar onLogout={() => {
                    localStorage.removeItem('token');
                    navigate('/login');
                }} />
                <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                    <LoadingSpinner size="60px" />
                </div>
            </>
        );
    }

    if (error || !profile) {
        return (
            <>
                <Navbar onLogout={() => {
                    localStorage.removeItem('token');
                    navigate('/login');
                }} />
                <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
                    <h2>{error}</h2>
                    <Button onClick={() => navigate(-1)} variant="outline" style={{ marginTop: '1rem' }}>
                        {t('common.back')}
                    </Button>
                </div>
            </>
        );
    }

    // Calculate days smoke free
    const getDaysSmokeFree = () => {
        if (!profile.quitDate) return null;
        const quit = new Date(profile.quitDate).getTime();
        const now = new Date().getTime();
        const diffDays = Math.floor(Math.max(0, now - quit) / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const daysSmokeFree = getDaysSmokeFree();

    // Last seen formatter
    const formatLastSeen = (dateString: string | null) => {
        if (!dateString) return t('messages.offline');
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        if (diffMs < 5 * 60000) return t('messages.online'); // less than 5 min = online
        
        // This year - show date without year
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <Navbar onLogout={() => {
                localStorage.removeItem('token');
                navigate('/login');
            }} />
            
            <div className="container" style={{ maxWidth: '400px', margin: '3rem auto', padding: '0 1rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '100%' }}>
                    <Button onClick={() => navigate(-1)} variant="ghost" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                        ← {t('common.back')}
                    </Button>
                </div>

                    <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', margin: '0 auto' }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: profile.avatarThumbnailUrl || profile.avatarUrl ? `url(${profile.avatarThumbnailUrl || profile.avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--accent-color), var(--accent-hover))',
                            color: 'white',
                            fontSize: (profile.avatarThumbnailUrl || profile.avatarUrl) ? '0' : '3rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem auto',
                            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
                            cursor: profile.avatarUrl ? 'pointer' : 'default',
                            transition: 'transform 0.2s',
                        }}
                        onClick={() => profile.avatarUrl && setShowAvatarModal(true)}
                        onMouseEnter={(e) => { if (profile.avatarUrl) e.currentTarget.style.transform = 'scale(1.05)' }}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title={profile.avatarUrl ? t('profile.viewFullAvatar') || 'View full avatar' : undefined}
                        >
                            {!profile.avatarThumbnailUrl && !profile.avatarUrl && profile.name.charAt(0).toUpperCase()}
                        </div>
                    
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{profile.name}</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Clock size={16} />
                        {formatLastSeen(profile.lastSeen)}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Calendar size={28} style={{ color: 'var(--success-color)', marginBottom: '0.75rem', margin: '0 auto' }} />
                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                                {daysSmokeFree !== null ? daysSmokeFree : '-'}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                {t('profile.daysSmokeFree') || 'Days smoke-free'}
                            </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Trophy size={28} style={{ color: '#fbbf24', marginBottom: '0.75rem', margin: '0 auto' }} />
                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                                {profile.completedMarathonsCount}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                {t('profile.completedMarathons') || 'Marathons completed'}
                            </div>
                        </div>
                    </div>

                    {profile.id !== localStorage.getItem('userId') && (
                        <Button 
                            variant="primary" 
                            size="lg" 
                            fullWidth 
                            onClick={handleSendMessage}
                            loading={startingChat}
                            disabled={startingChat}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <MessageCircle size={20} />
                                {t('profile.sendMessage') || 'Send Message'}
                            </div>
                        </Button>
                    )}
                </div>
            </div>

            {/* Avatar Modal */}
            {showAvatarModal && profile.avatarUrl && (
                <div 
                    onClick={() => setShowAvatarModal(false)}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'zoom-out',
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    <button 
                        style={{
                            position: 'absolute', top: '1.5rem', right: '1.5rem',
                            background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                            cursor: 'pointer', padding: '0.75rem', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onClick={(e) => { e.stopPropagation(); setShowAvatarModal(false); }}
                    >
                        <X size={24} />
                    </button>
                    <img 
                        src={profile.avatarUrl} 
                        alt={profile.name}
                        style={{
                            maxWidth: '90%', maxHeight: '90%',
                            objectFit: 'contain', borderRadius: '12px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                            cursor: 'default'
                        }} 
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
            
            
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
}
