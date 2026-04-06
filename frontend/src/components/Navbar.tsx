import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import InstallPwaButton from './InstallPwaButton';
import SOSModal from './SOSModal';
import { useNotifications } from '../contexts/NotificationContext';
import Logo from './Logo';

interface NavbarProps {
    onLogout?: () => void;
}

export default function Navbar({ onLogout }: NavbarProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [communityOpen, setCommunityOpen] = useState(false);
    const [sosOpen, setSosOpen] = useState(false);
    const { unreadCount } = useNotifications();
    const isAuthenticated = !!localStorage.getItem('token');

    interface NavItem {
        path?: string;
        label: string;
        icon: string;
        id?: string;
        children?: { path: string; label: string; icon: string; }[];
    }

    const authenticatedNavItems: NavItem[] = [
        { path: '/dashboard', label: t('nav.dashboard'), icon: '🏠' },
        {
            id: 'community',
            label: t('nav.community'),
            icon: '👥',
            children: [
                { path: '/leaderboard', label: t('nav.leaderboard'), icon: '🏆' },
                { path: '/marathons', label: t('marathon.title'), icon: '🏃' },
                { path: '/messages', label: t('messages.title'), icon: '💬' },
                { path: '/articles', label: t('articles.title'), icon: '📰' },
                { path: '/books', label: t('books.title') || 'Библиотека', icon: '📚' },
            ]
        },
        { path: '/profile', label: t('nav.profile'), icon: '👤' },
    ];

    const guestNavItems: NavItem[] = [
        {
            id: 'explore',
            label: t('landing.explore.title') || 'Полезное',
            icon: '🔍',
            children: [
                { path: '/articles', label: t('articles.title'), icon: '📰' },
                { path: '/books', label: t('books.title') || 'Библиотека', icon: '📚' },
            ]
        },
        {
            id: 'community_guest',
            label: t('nav.community'),
            icon: '👥',
            children: [
                { path: '/leaderboard', label: t('nav.leaderboard'), icon: '🏆' },
                { path: '/marathons', label: t('marathon.title'), icon: '🏃' },
            ]
        },
    ];

    const navItems = isAuthenticated ? authenticatedNavItems : guestNavItems;

    const isActive = (path?: string) => path ? location.pathname === path : false;
    const isChildActive = (children: { path: string }[]) => children.some(child => isActive(child.path));

    // Block body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    return (
        <>
            <SOSModal isOpen={sosOpen} onClose={() => setSosOpen(false)} />

            <div
                onClick={() => setMobileMenuOpen(false)}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(2, 6, 23, 0.4)',
                    backdropFilter: 'blur(12px)',
                    zIndex: 1000,
                    opacity: mobileMenuOpen ? 1 : 0,
                    visibility: mobileMenuOpen ? 'visible' : 'hidden',
                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'none'
                }}
                className="mobile-backdrop"
            />

            <nav style={{
                background: 'rgba(30, 41, 59, 0.95)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                width: '100%',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
                <div className="header-container" style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    height: '75px'
                }}>
                    {/* Column 1: Logo */}
                    <div className="logo-col" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <Logo size={35} showText={true} onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')} />
                    </div>

                    {/* Column 2: Centered Desktop Links */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}
                        className="desktop-nav"
                    >
                        {navItems.map((item) => {
                            if (item.children) {
                                const active = isChildActive(item.children);
                                return (
                                    <div key={item.id} style={{ position: 'relative' }}
                                        onMouseEnter={() => setCommunityOpen(true)}
                                        onMouseLeave={() => setCommunityOpen(false)}
                                    >
                                        <button
                                            style={{
                                                padding: '0.6rem 0.9rem',
                                                background: 'transparent',
                                                border: 'none',
                                                borderRadius: '0.5rem',
                                                color: active ? 'var(--accent-color)' : 'var(--text-secondary)',
                                                fontSize: '0.9deg',
                                                fontWeight: active ? '700' : '500',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                                            {item.label}
                                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ 
                                                marginLeft: '0.2rem', 
                                                transform: communityOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.3s ease',
                                                stroke: 'currentColor',
                                                strokeWidth: '1.5',
                                                strokeLinecap: 'round',
                                                strokeLinejoin: 'round'
                                            }}>
                                                <path d="M1 1L5 5L9 1" />
                                            </svg>
                                            
                                            {/* Active link indicator */}
                                            {active && (
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: '20%',
                                                    right: '20%',
                                                    height: '2px',
                                                    background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)',
                                                    borderRadius: '2px'
                                                }} />
                                            )}
                                        </button>

                                        {/* Dropdown */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: '50%',
                                            transform: `translateX(-50%) translateY(${communityOpen ? '0' : '-10px'})`,
                                            opacity: communityOpen ? 1 : 0,
                                            visibility: communityOpen ? 'visible' : 'hidden',
                                            background: 'rgba(30, 41, 59, 0.98)',
                                            backdropFilter: 'blur(16px)',
                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                            borderRadius: '0.75rem',
                                            padding: '0.5rem',
                                            minWidth: '220px',
                                            boxShadow: communityOpen
                                                ? '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                                                : '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            zIndex: 1001,
                                            marginTop: '0.5rem'
                                        }}>
                                            {item.children.map(child => (
                                                <button
                                                    key={child.path}
                                                    onClick={() => {
                                                        navigate(child.path);
                                                        setCommunityOpen(false);
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem 1rem',
                                                        background: isActive(child.path)
                                                            ? 'rgba(59, 130, 246, 0.1)'
                                                            : 'transparent',
                                                        border: 'none',
                                                        borderRadius: '0.5rem',
                                                        color: isActive(child.path) ? 'var(--accent-color)' : 'var(--text-secondary)',
                                                        fontSize: '0.9rem',
                                                        fontWeight: '500',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        textAlign: 'left',
                                                        marginBottom: '0.25rem'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isActive(child.path)) {
                                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                                            e.currentTarget.style.color = 'var(--text-primary)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isActive(child.path)) {
                                                            e.currentTarget.style.background = 'transparent';
                                                            e.currentTarget.style.color = 'var(--text-secondary)';
                                                        }
                                                    }}
                                                >
                                                    <span>{child.icon}</span>
                                                    {child.label}
                                                    {child.path === '/messages' && unreadCount > 0 && (
                                                        <span style={{
                                                            marginLeft: 'auto',
                                                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                                            color: 'white',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600',
                                                            padding: '0.125rem 0.5rem',
                                                            borderRadius: '1rem',
                                                            minWidth: '20px',
                                                            textAlign: 'center',
                                                            animation: 'badge-pulse 2s ease-in-out infinite',
                                                            boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                                                        }}>
                                                            {unreadCount > 99 ? '99+' : unreadCount}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <button
                                    key={item.path}
                                    onClick={() => item.path && navigate(item.path)}
                                    style={{
                                        padding: '0.6rem 0.9rem',
                                        background: 'transparent',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        color: isActive(item.path) ? 'var(--accent-color)' : 'var(--text-secondary)',
                                        fontSize: '0.9rem',
                                        fontWeight: isActive(item.path) ? '700' : '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive(item.path)) {
                                            e.currentTarget.style.color = 'var(--text-primary)';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive(item.path)) {
                                            e.currentTarget.style.color = 'var(--text-secondary)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }
                                    }}
                                >
                                    <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                                    {item.label}

                                    {/* Active link indicator */}
                                    {isActive(item.path) && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: '20%',
                                            right: '25%',
                                            height: '2px',
                                            background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)',
                                            borderRadius: '2px'
                                        }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Column 3: Action Buttons (Right Aligned) */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center',
                        justifyContent: 'flex-end'
                    }}
                        className="desktop-actions"
                    >
                        {/* SOS Button */}
                        <button
                            onClick={() => setSosOpen(true)}
                            title={t('landing.hero.emergency') || 'Хочу закурить!'}
                            style={{
                                padding: '0.4rem 0.7rem',
                                background: 'rgba(251, 191, 36, 0.15)',
                                border: '1px solid rgba(251, 191, 36, 0.3)',
                                borderRadius: '0.5rem',
                                color: '#fbbf24',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.25)';
                                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.15)';
                                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                            }}
                        >
                            🫁 SOS
                        </button>

                        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.06)', margin: '0 0.5rem' }}></div>

                        <LanguageSwitcher compact />
                        <InstallPwaButton />

                        {isAuthenticated ? (
                            <button
                                onClick={onLogout}
                                style={{
                                    padding: '0.4rem 0.7rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '0.5rem',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    fontSize: '0.8rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                    e.currentTarget.style.color = '#ef4444';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                                }}
                            >
                                <span>↗</span>
                                {t('common.logout')}
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(99, 102, 241, 0.2))',
                                    border: '2px solid rgba(59, 130, 246, 0.5)',
                                    borderRadius: '0.75rem',
                                    color: 'var(--accent-color)',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.35), rgba(99, 102, 241, 0.3))';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(99, 102, 241, 0.2))';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <span>🔐</span>
                                {t('landing.hero.login')}
                            </button>
                        )}
                    </div>

                    <button
                        className="mobile-hamburger"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        style={{
                            display: 'none',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '10px',
                            cursor: 'pointer',
                            color: mobileMenuOpen ? 'var(--accent-color)' : 'var(--text-primary)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            zIndex: 2001,
                            width: '44px',
                            height: '44px',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        <div style={{
                            width: '20px',
                            height: '14px',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}>
                            <span style={{
                                width: '100%',
                                height: '2px',
                                background: 'currentColor',
                                borderRadius: '10px',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                transform: mobileMenuOpen ? 'translateY(6px) rotate(45deg)' : 'none'
                            }}></span>
                            <span style={{
                                width: mobileMenuOpen ? '0%' : '70%',
                                height: '2px',
                                background: 'currentColor',
                                borderRadius: '10px',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                opacity: mobileMenuOpen ? 0 : 1
                            }}></span>
                            <span style={{
                                width: '100%',
                                height: '2px',
                                background: 'currentColor',
                                borderRadius: '10px',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                transform: mobileMenuOpen ? 'translateY(-6px) rotate(-45deg)' : 'none'
                            }}></span>
                        </div>
                    </button>
                </div>


                <style>{`
                    @keyframes sos-pulse {
                        0%, 100% {
                            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5), 0 0 20px rgba(239, 68, 68, 0.3);
                        }
                        50% {
                            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.7), 0 0 30px rgba(239, 68, 68, 0.5);
                        }
                    }

                    .badge-pulse {
                        margin-left: auto;
                        background: #ef4444;
                        color: white;
                        font-size: 0.75rem;
                        font-weight: 700;
                        padding: 2px 8px;
                        border-radius: 20px;
                        min-width: 20px;
                        text-align: center;
                        animation: badge-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                        box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
                    }

                    @keyframes badge-pulse {
                        0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                        50% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
                    }

                    /* Active menu indicator */
                    .desktop-nav button {
                        position: relative;
                    }

                    .desktop-nav button::after {
                        content: '';
                        position: absolute;
                        bottom: -2px;
                        left: 50%;
                        transform: translateX(-50%) scaleX(0);
                        width: 80%;
                        height: 3px;
                        background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
                        border-radius: 2px;
                        transition: transform 0.3s ease;
                    }

                    .desktop-nav button:hover::after {
                        transform: translateX(-50%) scaleX(0.7);
                    }

                    .mobile-nav button {
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    }

                    .mobile-nav button:hover {
                        background: rgba(255, 255, 255, 0.05) !important;
                        transform: translateX(4px);
                    }

                    .mobile-nav button:active {
                        background: rgba(255, 255, 255, 0.1) !important;
                        transform: scale(0.98);
                    }

                    /* Active state special hover */
                    .mobile-nav button.active-link:hover {
                         background: rgba(59, 130, 246, 0.15) !important;
                    }

                    @media (max-width: 1150px) {
                        .header-container {
                            justify-content: space-between !important;
                            padding: 0 1rem !important;
                        }
                        .logo-col {
                            flex: 0 !important;
                        }
                        .desktop-nav, .desktop-actions {
                            display: none !important;
                        }
                        .mobile-hamburger {
                            display: flex !important;
                        }
                        .mobile-nav {
                            display: flex !important;
                        }
                        .mobile-backdrop {
                            display: block !important;
                        }
                    }
                `}</style>
            </nav>

            {/* Mobile Menu Backdrop */}
            <div
                className="mobile-backdrop"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                    display: 'none', // Managed by media queries in the <style> block
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 1999,
                    opacity: mobileMenuOpen ? 1 : 0,
                    pointerEvents: mobileMenuOpen ? 'auto' : 'none',
                    transition: 'all 0.4s ease-in-out'
                }}
            />

            {/* Mobile Menu Drawer */}
            <div
                className="mobile-nav"
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '85%',
                    maxWidth: '320px',
                    height: '100vh',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(32px) saturate(180%)',
                    borderLeft: '1px solid rgba(59, 130, 246, 0.15)',
                    padding: '1.25rem',
                    transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
                    visibility: mobileMenuOpen ? 'visible' : 'hidden',
                    transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: mobileMenuOpen
                        ? '-20px 0 60px rgba(0, 0, 0, 0.5)'
                        : 'none',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    WebkitOverflowScrolling: 'touch',
                    zIndex: 2000
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.5rem' }}>
                    {/* Header: Logo and Close Action */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginTop: '1rem',
                        padding: '0 0.5rem',
                        opacity: mobileMenuOpen ? 1 : 0,
                        transform: mobileMenuOpen ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'all 0.4s 0.1s'
                    }}>
                        <Logo size={42} showText={true} onClick={() => { navigate(isAuthenticated ? '/dashboard' : '/'); setMobileMenuOpen(false); }} />
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                width: '40px',
                                height: '40px',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                cursor: 'pointer'
                            }}
                        >✕</button>
                    </div>

                    {/* Navigation Links */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {navItems.map((item, index) => (
                            <div key={item.path || item.id} style={{
                                opacity: mobileMenuOpen ? 1 : 0,
                                transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(20px)',
                                transition: `all 0.4s ${0.2 + index * 0.05}s`
                            }}>
                                {item.children ? (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{
                                            padding: '0.75rem 0.5rem',
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.8rem',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            <span>{item.icon}</span>
                                            {item.label}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            {item.children.map((child) => (
                                                <button
                                                    key={child.path}
                                                    className={isActive(child.path) ? 'active-link' : ''}
                                                    onClick={() => {
                                                        navigate(child.path);
                                                        setMobileMenuOpen(false);
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        padding: '1rem 0.75rem',
                                                        background: isActive(child.path) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                        border: 'none',
                                                        borderRadius: '12px',
                                                        color: isActive(child.path) ? 'var(--accent-color)' : 'var(--text-primary)',
                                                        fontSize: '1rem',
                                                        fontWeight: '500',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '1rem',
                                                        transition: 'all 0.2s',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    {isActive(child.path) && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            left: 0,
                                                            width: '3px',
                                                            height: '100%',
                                                            background: 'var(--accent-color)',
                                                            borderRadius: '0 4px 4px 0'
                                                        }} />
                                                    )}
                                                    <span style={{ fontSize: '1.25rem' }}>{child.icon}</span>
                                                    <span style={{ flex: 1 }}>{child.label}</span>
                                                    {child.path === '/messages' && unreadCount > 0 && (
                                                        <span className="badge-pulse">{unreadCount}</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            if (item.path) {
                                                navigate(item.path);
                                                setMobileMenuOpen(false);
                                            }
                                        }}
                                        className={isActive(item.path) ? 'active-link' : ''}
                                        style={{
                                            width: '100%',
                                            padding: '1rem 0.75rem',
                                            background: isActive(item.path) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                            border: 'none',
                                            borderRadius: '12px',
                                            color: isActive(item.path) ? 'var(--accent-color)' : 'var(--text-primary)',
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            transition: 'all 0.2s',
                                            position: 'relative',
                                            textAlign: 'left'
                                        }}
                                    >
                                        {isActive(item.path) && (
                                            <div style={{
                                                position: 'absolute',
                                                left: 0,
                                                width: '3px',
                                                height: '100%',
                                                background: 'var(--accent-color)',
                                                borderRadius: '0 4px 4px 0'
                                            }} />
                                        )}
                                        <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                                        {item.label}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Bottom Actions */}
                    <div style={{
                        marginTop: 'auto',
                        padding: '1.5rem 0',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        opacity: mobileMenuOpen ? 1 : 0,
                        transform: mobileMenuOpen ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'all 0.4s 0.5s'
                    }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}><LanguageSwitcher compact={false} /></div>
                            <button
                                onClick={() => { setSosOpen(true); setMobileMenuOpen(false); }}
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'rgba(251, 191, 36, 0.1)',
                                    border: '1px solid rgba(251, 191, 36, 0.2)',
                                    color: '#fbbf24',
                                    fontSize: '1.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >🫁</button>
                        </div>

                        <InstallPwaButton />

                        {isAuthenticated ? (
                            <button
                                onClick={() => { onLogout?.(); setMobileMenuOpen(false); }}
                                style={{
                                    padding: '1rem',
                                    background: 'rgba(239, 68, 68, 0.05)',
                                    border: '1px solid rgba(239, 68, 68, 0.1)',
                                    borderRadius: '12px',
                                    color: '#ef4444',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    width: '100%'
                                }}
                            >
                                <span>↪</span> {t('common.logout')}
                            </button>
                        ) : (
                            <button
                                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                                style={{
                                    padding: '1rem',
                                    background: 'linear-gradient(135deg, var(--accent-color), var(--accent-hover))',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    width: '100%',
                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                                }}
                            >
                                🔐 {t('landing.hero.login')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
