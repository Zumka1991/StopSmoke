import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { MessageCircle } from 'lucide-react';

interface LeaderboardEntry {
    rank: number;
    name: string;
    email: string;
    daysClean: number;
    isCurrentUser: boolean;
}

export default function LeaderboardPage() {
    const { t } = useTranslation();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        navigate('/login');
    };

    const handleMessageUser = async (email: string) => {
        try {
            await api.post('/messages/conversations', {
                participantEmail: email
            });
            navigate('/messages');
        } catch (error) {
            console.error('Failed to create conversation:', error);
            alert('Failed to create conversation. Please try again.');
        }
        setMenuOpen(null);
    };

    const handleEntryClick = (entry: LeaderboardEntry, e: React.MouseEvent) => {
        if (!entry.isCurrentUser && isAuthenticated) {
            e.stopPropagation();
            setMenuOpen(menuOpen === entry.rank ? null : entry.rank);
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await api.get('/leaderboard');
                setLeaderboard(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to load leaderboard');
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <>
                <Navbar onLogout={handleLogout} />
                <div className="container text-center" style={{ marginTop: '3rem' }}>
                    {t('leaderboard.loading')}
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar onLogout={handleLogout} />
            <div className="container" style={{ marginTop: '2rem', maxWidth: '900px' }}>
                <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    🏆 {t('leaderboard.title')}
                </h1>

                {leaderboard.length === 0 ? (
                    <div className="card text-center" style={{ padding: '3rem' }}>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                            {t('leaderboard.empty')}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {leaderboard.map((entry) => (
                            <div
                                key={entry.rank}
                                onClick={(e) => handleEntryClick(entry, e)}
                                style={{
                                    position: 'relative',
                                    background: entry.isCurrentUser
                                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.1))'
                                        : entry.rank <= 3
                                            ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(255, 193, 7, 0.05))'
                                            : 'rgba(255, 255, 255, 0.03)',
                                    border: entry.isCurrentUser
                                        ? '2px solid rgba(59, 130, 246, 0.5)'
                                        : entry.rank <= 3
                                            ? '2px solid rgba(255, 215, 0, 0.3)'
                                            : '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '1rem',
                                    padding: '1.5rem',
                                    display: 'grid',
                                    gridTemplateColumns: '60px 1fr auto',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    transition: 'all 0.2s',
                                    cursor: (entry.isCurrentUser || !isAuthenticated) ? 'default' : 'pointer',
                                    zIndex: menuOpen === entry.rank ? 100 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!entry.isCurrentUser && isAuthenticated) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!entry.isCurrentUser && isAuthenticated) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                {/* Rank */}
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        fontSize: entry.rank <= 3 ? '2.5rem' : '1.5rem',
                                        fontWeight: 'bold',
                                        color: entry.rank === 1 ? '#FFD700'
                                            : entry.rank === 2 ? '#C0C0C0'
                                                : entry.rank === 3 ? '#CD7F32'
                                                    : 'var(--text-secondary)'
                                    }}>
                                        {entry.rank <= 3 ? (
                                            entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'
                                        ) : (
                                            `#${entry.rank}`
                                        )}
                                    </div>
                                </div>

                                {/* Name */}
                                <div>
                                    <div style={{
                                        fontSize: '1.25rem',
                                        fontWeight: '600',
                                        color: entry.isCurrentUser ? 'var(--accent-color)' : 'var(--text-primary)',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {entry.name}
                                        {entry.isCurrentUser && (
                                            <span style={{
                                                marginLeft: '0.5rem',
                                                fontSize: '0.875rem',
                                                color: 'var(--accent-color)',
                                                fontWeight: '500'
                                            }}>
                                                ({t('leaderboard.you')})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Days */}
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold',
                                        color: 'var(--success-color)'
                                    }}>
                                        {entry.daysClean}
                                    </div>
                                    <div style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        {t('leaderboard.days')}
                                    </div>
                                </div>

                                {/* Popup Menu */}
                                {menuOpen === entry.rank && !entry.isCurrentUser && (
                                    <div
                                        ref={menuRef}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: '1rem',
                                            marginTop: '0.5rem',
                                            background: 'var(--card-bg)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '0.5rem',
                                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                                            overflow: 'hidden',
                                            zIndex: 10,
                                            minWidth: '200px'
                                        }}
                                    >
                                        <button
                                            onClick={() => handleMessageUser(entry.email)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem 1rem',
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-primary)',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                fontSize: '1rem',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            <MessageCircle size={18} />
                                            {t('leaderboard.sendMessage') || 'Send Message'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
