import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import Navbar from '../components/Navbar';

interface LeaderboardEntry {
    rank: number;
    name: string;
    daysClean: number;
    isCurrentUser: boolean;
}

export default function LeaderboardPage() {
    const { t } = useTranslation();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        navigate('/login');
    };

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
                                style={{
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
                                    cursor: entry.isCurrentUser ? 'default' : 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    if (!entry.isCurrentUser) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!entry.isCurrentUser) {
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
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
