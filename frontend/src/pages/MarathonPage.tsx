import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Marathon, CreateMarathonDto, User } from '../types';

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
                        <div key={marathon.id} className="card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2rem', padding: '2rem', width: '100%', maxWidth: 'none' }}>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#3b82f6', fontWeight: '700' }}>{marathon.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{marathon.description}</p>
                                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <span>📅 {new Date(marathon.startDate).toLocaleDateString()} - {new Date(marathon.endDate).toLocaleDateString()}</span>
                                    <span>👥 {marathon.participantsCount} {t('marathon.participants')}</span>
                                    <span>⏱️ {getTimeStatus(marathon)}</span>
                                </div>
                            </div>

                            <div style={{ minWidth: '180px', display: 'flex', justifyContent: 'flex-end' }}>
                                {marathon.isJoined ? (
                                    <div style={{
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '1rem',
                                        background: marathon.userStatus === 'Active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                        color: marathon.userStatus === 'Active' ? '#4ade80' : '#f87171',
                                        fontWeight: '700',
                                        fontSize: '0.95rem',
                                        textAlign: 'center',
                                        minWidth: '150px'
                                    }}>
                                        {marathon.userStatus === 'Active' ? t('marathon.joined') : t('marathon.disqualified')}
                                    </div>
                                ) : (
                                    new Date(marathon.startDate) > new Date() && (
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handleJoin(marathon.id)}
                                            style={{ padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: '600', minWidth: '150px' }}
                                        >
                                            {t('marathon.join')}
                                        </button>
                                    )
                                )}
                            </div>
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

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
}
