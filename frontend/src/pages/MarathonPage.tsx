import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Marathon, CreateMarathonDto, User, MarathonParticipant } from '../types';

export default function MarathonPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [marathons, setMarathons] = useState<Marathon[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Create Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState<CreateMarathonDto>({
        title: '',
        description: '',
        startDate: '',
        endDate: ''
    });

    // Participants Modal State
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);
    const [participants, setParticipants] = useState<MarathonParticipant[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [marathonsRes, profileRes] = await Promise.all([
                api.get('/marathon'),
                api.get('/profile')
            ]);
            setMarathons(marathonsRes.data);
            setUser(profileRes.data);
        } catch (err) {
            console.error('Failed to fetch data', err);
            setToast({ message: 'Failed to load data', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        navigate('/login');
    };

    const handleJoin = async (id: number) => {
        try {
            await api.post(`/marathon/${id}/join`);
            setToast({ message: t('marathon.joined'), type: 'success' });
            fetchData(); // Refresh list
        } catch (err: any) {
            setToast({ message: err.response?.data || 'Failed to join', type: 'error' });
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post('/marathon', {
                ...formData,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString()
            });
            setToast({ message: 'Marathon created', type: 'success' });
            setShowCreateModal(false);
            setFormData({ title: '', description: '', startDate: '', endDate: '' });
            fetchData();
        } catch (err) {
            setToast({ message: 'Failed to create marathon', type: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const handleShowParticipants = async (marathonId: number) => {
        setShowParticipantsModal(true);
        setLoadingParticipants(true);

        try {
            const response = await api.get(`/marathon/${marathonId}/participants`);
            setParticipants(response.data);
        } catch (err) {
            console.error('Failed to load participants', err);
            setToast({ message: 'Failed to load participants', type: 'error' });
        } finally {
            setLoadingParticipants(false);
        }
    };

    const getTimeStatus = (marathon: Marathon) => {
        const now = new Date();
        const start = new Date(marathon.startDate);
        const end = new Date(marathon.endDate);

        if (now < start) {
            const diff = start.getTime() - now.getTime();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            return `${t('marathon.startsIn')} ${days}${t('marathon.days')} ${hours}${t('marathon.hours')}`;
        } else if (now >= start && now <= end) {
            return t('marathon.started');
        } else {
            return t('marathon.completed');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <>
            <Navbar onLogout={handleLogout} />
            <div className="container" style={{ maxWidth: '1000px', margin: '3rem auto', paddingBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2>{t('marathon.title')}</h2>
                    {user?.isAdmin && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowCreateModal(true)}
                        >
                            {t('marathon.create')}
                        </button>
                    )}
                </div>

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {marathons.map(marathon => (
                        <div key={marathon.id} className="card marathon-card">
                            <div className="marathon-card-header">
                                <h3
                                    className="marathon-card-title marathon-card-title-clickable"
                                    onClick={() => handleShowParticipants(marathon.id)}
                                >
                                    {marathon.title}
                                </h3>
                                {marathon.isJoined && (
                                    <div className={`marathon-status-badge ${marathon.userStatus === 'Active' ? 'status-active' : 'status-disqualified'}`}>
                                        {marathon.userStatus === 'Active' ? t('marathon.joined') : t('marathon.disqualified')}
                                    </div>
                                )}
                            </div>

                            <p className="marathon-card-description">{marathon.description}</p>

                            <div className="marathon-card-info">
                                <div className="marathon-info-item">
                                    <span className="info-icon">📅</span>
                                    <div className="info-content">
                                        <div className="info-dates">
                                            {new Date(marathon.startDate).toLocaleDateString()}
                                            <span style={{ margin: '0 0.5rem' }}>-</span>
                                            {new Date(marathon.endDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="marathon-info-row">
                                    <div className="marathon-info-item">
                                        <span className="info-icon">👥</span>
                                        <span className="info-text">{marathon.participantsCount} {t('marathon.participants')}</span>
                                    </div>

                                    <div className="marathon-info-item">
                                        <span className="info-icon">⏱️</span>
                                        <span className="info-text">{getTimeStatus(marathon)}</span>
                                    </div>
                                </div>
                            </div>

                            {!marathon.isJoined && new Date(marathon.startDate) > new Date() && (
                                <button
                                    className="btn btn-primary marathon-join-btn"
                                    onClick={() => handleJoin(marathon.id)}
                                >
                                    {t('marathon.join')}
                                </button>
                            )}
                        </div>
                    ))}

                    {marathons.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            No marathons available yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem'
                }} onClick={() => setShowCreateModal(false)}>
                    <div className="card" style={{ maxWidth: '500px', width: '100%', margin: 0 }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{t('marathon.createTitle')}</h3>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label className="form-label">{t('marathon.formTitle')}</label>
                                <input
                                    className="form-input"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('marathon.formDesc')}</label>
                                <textarea
                                    className="form-input"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('marathon.formStart')}</label>
                                <input
                                    type="datetime-local"
                                    className="form-input"
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('marathon.formEnd')}</label>
                                <input
                                    type="datetime-local"
                                    className="form-input"
                                    value={formData.endDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="submit" className="btn btn-primary" disabled={creating} style={{ flex: 1 }}>
                                    {creating ? <LoadingSpinner size="20px" /> : t('marathon.createBtn')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    style={{
                                        flex: 1, padding: '0.75rem', background: 'transparent',
                                        border: '1px solid var(--text-secondary)', borderRadius: '0.5rem',
                                        color: 'var(--text-primary)', cursor: 'pointer'
                                    }}
                                >
                                    {t('marathon.cancelBtn')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Participants Modal */}
            {showParticipantsModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem'
                    }}
                    onClick={() => {
                        setShowParticipantsModal(false);
                        setParticipants([]);
                    }}
                >
                    <div
                        className="card"
                        style={{
                            maxWidth: '600px',
                            width: '100%',
                            margin: 0,
                            maxHeight: '80vh',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            👥 {t('marathon.participants')}
                        </h3>

                        {loadingParticipants ? (
                            <div style={{ textAlign: 'center', padding: '3rem' }}>
                                <LoadingSpinner />
                            </div>
                        ) : participants.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                {t('marathon.noParticipants')}
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem',
                                    overflowY: 'auto',
                                    maxHeight: 'calc(80vh - 120px)'
                                }}
                            >
                                {participants.map((participant) => {
                                    const daysText = participant.daysSinceLapse === 1
                                        ? t('marathon.daysSmokeFreeSingular')
                                        : t('marathon.daysSmokeFreePlural');

                                    const statusText = participant.status === 'Active'
                                        ? t('marathon.statusActive')
                                        : participant.status === 'Completed'
                                        ? t('marathon.statusCompleted')
                                        : t('marathon.statusDisqualified');

                                    return (
                                        <div
                                            key={participant.userId}
                                            className="participant-item"
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '1rem',
                                                background: 'rgba(59, 130, 246, 0.05)',
                                                borderRadius: '0.75rem',
                                                border: '1px solid rgba(59, 130, 246, 0.1)',
                                                gap: '1rem'
                                            }}
                                        >
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem', wordBreak: 'break-word' }}>
                                                    {participant.userName}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    {participant.daysSinceLapse} {daysText}
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    padding: '0.4rem 0.875rem',
                                                    borderRadius: '1.5rem',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600',
                                                    whiteSpace: 'nowrap',
                                                    flexShrink: 0,
                                                    ...(participant.status === 'Active' ? {
                                                        background: 'rgba(34, 197, 94, 0.15)',
                                                        color: '#4ade80',
                                                        border: '1px solid rgba(34, 197, 94, 0.3)'
                                                    } : participant.status === 'Completed' ? {
                                                        background: 'rgba(59, 130, 246, 0.15)',
                                                        color: '#60a5fa',
                                                        border: '1px solid rgba(59, 130, 246, 0.3)'
                                                    } : {
                                                        background: 'rgba(239, 68, 68, 0.15)',
                                                        color: '#f87171',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)'
                                                    })
                                                }}
                                            >
                                                {statusText}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setShowParticipantsModal(false);
                                setParticipants([]);
                            }}
                            style={{
                                marginTop: '1.5rem',
                                padding: '0.75rem',
                                background: 'transparent',
                                border: '1px solid var(--text-secondary)',
                                borderRadius: '0.5rem',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            {t('marathon.closeBtn')}
                        </button>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
}
