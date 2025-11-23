import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setIsOpen(false);
    };

    const languages = [
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'ru', name: 'Russian', flag: '🇷🇺' }
    ];

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '2px solid var(--accent-color)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    minWidth: '120px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                }}
            >
                <span>{currentLanguage.flag}</span>
                <span>{currentLanguage.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                    {isOpen ? '▲' : '▼'}
                </span>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop to close dropdown when clicking outside */}
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999
                        }}
                    />

                    <div
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 0.5rem)',
                            right: 0,
                            background: 'var(--card-bg)',
                            border: '2px solid var(--accent-color)',
                            borderRadius: '0.5rem',
                            boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
                            minWidth: '150px',
                            zIndex: 1000,
                            overflow: 'hidden'
                        }}
                    >
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    background: i18n.language === lang.code
                                        ? 'rgba(59, 130, 246, 0.2)'
                                        : 'transparent',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: i18n.language === lang.code ? '600' : '400',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    transition: 'all 0.2s',
                                    textAlign: 'left'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = i18n.language === lang.code
                                        ? 'rgba(59, 130, 246, 0.2)'
                                        : 'transparent';
                                }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
                                <span>{lang.name}</span>
                                {i18n.language === lang.code && (
                                    <span style={{ marginLeft: 'auto', color: 'var(--accent-color)' }}>✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
