import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

export default function Footer() {
    const { t } = useTranslation();
    const location = useLocation();
    const currentYear = new Date().getFullYear();

    // Hide footer on messages page to avoid overlapping chat layout
    if (location.pathname === '/messages') {
        return null;
    }

    return (
        <footer style={{
            padding: '1.5rem',
            textAlign: 'center',
            color: 'var(--text-secondary, #94a3b8)',
            borderTop: '1px solid var(--border-color, rgba(51, 65, 85, 0.4))',
            marginTop: 'auto',
            width: '100%',
            backgroundColor: 'var(--bg-card, rgba(30, 41, 59, 0.8))',
            backdropFilter: 'blur(10px)',
            zIndex: 10
        }}>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>
                &copy; {currentYear} StopSmoke. {t('footer.rights')}.
            </p>
        </footer>
    );
}
