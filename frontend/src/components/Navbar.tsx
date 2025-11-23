import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import SOSModal from './SOSModal';

interface NavbarProps {
    onLogout: () => void;
}

export default function Navbar({ onLogout }: NavbarProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sosOpen, setSosOpen] = useState(false);

    const navItems = [
        { path: '/dashboard', label: t('nav.dashboard'), icon: '🏠' },
        { path: '/leaderboard', label: t('nav.leaderboard'), icon: '🏆' },
        { path: '/profile', label: t('nav.profile'), icon: '👤' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <>
            <SOSModal isOpen={sosOpen} onClose={() => setSosOpen(false)} />

            <nav style={{
                background: 'rgba(30, 41, 59, 0.95)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '70px'
                }}>
                    {/* Logo */}
                    <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, var(--accent-color), var(--success-color))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                        onClick={() => navigate('/dashboard')}
                    >
                        🚭 StopSmoke
                    </div>

                    {/* Desktop Menu */}
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'center'
                    }}
                        className="desktop-nav"
                    >
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                style={{
                                    padding: '0.75rem 1.25rem',
                                    background: isActive(item.path)
                                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(99, 102, 241, 0.2))'
                                        : 'transparent',
                                    border: isActive(item.path)
                                        ? '2px solid rgba(59, 130, 246, 0.5)'
                                        : '2px solid transparent',
                                    borderRadius: '0.75rem',
                                    color: isActive(item.path) ? 'var(--accent-color)' : 'var(--text-secondary)',
                                    fontSize: '0.95rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive(item.path)) {
                                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                        e.currentTarget.style.color = 'var(--text-primary)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive(item.path)) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }
                                }}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}

                        <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }}></div>

                        {/* SOS Button */}
                        <button
                            onClick={() => setSosOpen(true)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'var(--error-color)',
                                border: 'none',
                                borderRadius: '0.75rem',
                                color: 'white',
                                fontSize: '0.95rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                            }}
                        >
                            🆘 {t('sos.button')}
                        </button>

                        <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }}></div>

                        <LanguageSwitcher />

                        <button
                            onClick={onLogout}
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.15))',
                                border: '2px solid rgba(239, 68, 68, 0.4)',
                                borderRadius: '0.75rem',
                                color: '#ef4444',
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.25))';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.15))';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <span>🚪</span>
                            {t('common.logout')}
                        </button>
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        className="mobile-hamburger"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        style={{
                            display: 'none',
                            background: 'rgba(59, 130, 246, 0.2)',
                            border: '2px solid rgba(59, 130, 246, 0.4)',
                            borderRadius: '0.5rem',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            color: 'var(--accent-color)',
                            fontSize: '1.5rem'
                        }}
                    >
                        {mobileMenuOpen ? '✕' : '☰'}
                    </button>
                </div>

                {/* Mobile Menu */}
                <div
                    className="mobile-nav"
                    style={{
                        display: 'none',
                        position: 'fixed',
                        top: '70px',
                        left: 0,
                        right: 0,
                        background: 'rgba(30, 41, 59, 0.98)',
                        backdropFilter: 'blur(10px)',
                        borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                        padding: '1rem',
                        transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
                        transition: 'transform 0.3s ease',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => {
                                    navigate(item.path);
                                    setMobileMenuOpen(false);
                                }}
                                style={{
                                    padding: '1rem',
                                    background: isActive(item.path)
                                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(99, 102, 241, 0.2))'
                                        : 'rgba(255, 255, 255, 0.05)',
                                    border: isActive(item.path)
                                        ? '2px solid rgba(59, 130, 246, 0.5)'
                                        : '2px solid transparent',
                                    borderRadius: '0.75rem',
                                    color: isActive(item.path) ? 'var(--accent-color)' : 'var(--text-primary)',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    textAlign: 'left'
                                }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}

                        <button
                            onClick={() => {
                                setSosOpen(true);
                                setMobileMenuOpen(false);
                            }}
                            style={{
                                padding: '1rem',
                                background: 'var(--error-color)',
                                border: 'none',
                                borderRadius: '0.75rem',
                                color: 'white',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                textAlign: 'left',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>🆘</span>
                            {t('sos.button')}
                        </button>

                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }}></div>

                        <div style={{ padding: '0.5rem 0' }}>
                            <LanguageSwitcher />
                        </div>

                        <button
                            onClick={() => {
                                onLogout();
                                setMobileMenuOpen(false);
                            }}
                            style={{
                                padding: '1rem',
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.15))',
                                border: '2px solid rgba(239, 68, 68, 0.4)',
                                borderRadius: '0.75rem',
                                color: '#ef4444',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>🚪</span>
                            {t('common.logout')}
                        </button>
                    </div>
                </div>

                <style>{`
                    @media (max-width: 768px) {
                        .desktop-nav {
                            display: none !important;
                        }
                        .mobile-hamburger {
                            display: block !important;
                        }
                        .mobile-nav {
                            display: block !important;
                        }
                    }
                `}</style>
            </nav>
        </>
    );
}
