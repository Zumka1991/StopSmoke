import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button
                onClick={() => changeLanguage('en')}
                style={{
                    padding: '0.5rem 1rem',
                    background: i18n.language === 'en' ? 'var(--accent-color)' : 'var(--card-bg)',
                    border: '1px solid var(--accent-color)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: i18n.language === 'en' ? '600' : '400'
                }}
            >
                EN
            </button>
            <button
                onClick={() => changeLanguage('ru')}
                style={{
                    padding: '0.5rem 1rem',
                    background: i18n.language === 'ru' ? 'var(--accent-color)' : 'var(--card-bg)',
                    border: '1px solid var(--accent-color)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: i18n.language === 'ru' ? '600' : '400'
                }}
            >
                RU
            </button>
        </div>
    );
}
