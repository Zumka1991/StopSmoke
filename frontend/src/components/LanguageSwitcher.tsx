import { useTranslation } from 'react-i18next';

/**
 * LanguageSwitcher - A premium toggle-style (tumbler) component for RU/EN switching.
 * Highly responsive and visually optimized for both desktop and mobile views.
 */
export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const toggleLanguage = (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextLng = i18n.language === 'en' ? 'ru' : 'en';
        i18n.changeLanguage(nextLng);
    };

    const isRussian = i18n.language === 'ru';

    return (
        <div 
            onClick={toggleLanguage}
            className="language-toggle-container"
            title={isRussian ? "Switch to English" : "Переключить на русский"}
        >
            {/* Sliding Thumb Indicator */}
            <div className={`toggle-thumb ${isRussian ? 'is-ru' : 'is-en'}`}>
                {/* Shine effect on the thumb */}
                <div className="thumb-shine" />
            </div>

            {/* Language Labels with Icons */}
            <div className="toggle-labels">
                <div className={`label-item ${!isRussian ? 'active' : ''}`}>
                    <span className="flag-icon">🇬🇧</span>
                    <span className="lang-text">EN</span>
                </div>
                <div className={`label-item ${isRussian ? 'active' : ''}`}>
                    <span className="flag-icon">🇷🇺</span>
                    <span className="lang-text">RU</span>
                </div>
            </div>

            <style>{`
                .language-toggle-container {
                    position: relative;
                    display: flex;
                    align-items: center;
                    width: 100%;
                    max-width: 160px; /* Mobile width */
                    height: 48px;
                    background: rgba(30, 41, 59, 0.7);
                    backdrop-filter: blur(8px);
                    border-radius: 12px;
                    padding: 4px;
                    cursor: pointer;
                    border: 2px solid rgba(59, 130, 246, 0.3);
                    box-shadow: 
                        0 4px 15px rgba(0, 0, 0, 0.3),
                        inset 0 2px 4px rgba(0, 0, 0, 0.4),
                        0 0 0 1px rgba(255, 255, 255, 0.05);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    user-select: none;
                    overflow: hidden;
                    margin: 0.5rem 0;
                }

                /* Desktop Version Enhancements */
                @media (min-width: 768px) {
                    .language-toggle-container {
                        max-width: 120px; /* Increased from 90px */
                        height: 42px;    /* Increased from 36px */
                        border-radius: 21px; 
                        margin: 0.5rem;
                        border-width: 2px;
                    }
                    .lang-text {
                        font-size: 13px; /* Increased from 10px */
                    }
                    .flag-icon {
                        display: block; /* Show flags on desktop too for better visibility */
                        font-size: 1.1rem;
                    }
                }

                .language-toggle-container:hover {
                    border-color: rgba(59, 130, 246, 0.6);
                    background: rgba(30, 41, 59, 0.9);
                    transform: translateY(-1px);
                    box-shadow: 
                        0 6px 20px rgba(0, 0, 0, 0.4),
                        inset 0 2px 4px rgba(0, 0, 0, 0.4),
                        0 0 20px rgba(59, 130, 246, 0.2);
                }

                .toggle-thumb {
                    position: absolute;
                    top: 4px;
                    left: 4px;
                    width: calc(50% - 4px);
                    height: calc(100% - 8px);
                    background: linear-gradient(135deg, var(--accent-color), #2563eb);
                    border-radius: 8px;
                    box-shadow: 
                        0 2px 10px rgba(59, 130, 246, 0.6),
                        0 0 15px rgba(59, 130, 246, 0.3);
                    transition: transform 0.5s cubic-bezier(0.68, -0.6, 0.32, 1.6);
                    z-index: 1;
                }

                @media (min-width: 768px) {
                    .toggle-thumb {
                        border-radius: 17px; /* Slightly more rounded for desktop */
                    }
                }

                .toggle-thumb.is-ru {
                    transform: translateX(100%);
                }

                .thumb-shine {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                        135deg,
                        rgba(255, 255, 255, 0.2) 0%,
                        rgba(255, 255, 255, 0) 50%,
                        rgba(0, 0, 0, 0.1) 100%
                    );
                    border-radius: inherit;
                }

                .toggle-labels {
                    display: flex;
                    width: 100%;
                    height: 100%;
                    z-index: 2;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .label-item {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    opacity: 0.4;
                    transition: all 0.4s ease;
                    color: white;
                    font-weight: 800;
                    font-size: 14px;
                }

                @media (min-width: 768px) {
                    .label-item {
                        font-size: 12px;
                        gap: 6px;
                    }
                }

                .label-item.active {
                    opacity: 1;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
                }

                .lang-text {
                    font-family: 'Inter', sans-serif;
                }

                .flag-icon {
                    font-size: 1.2rem;
                }

                @media (max-width: 767px) {
                    .flag-icon {
                        font-size: 1.1rem;
                    }
                }
            `}</style>
        </div>
    );
}
