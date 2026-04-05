import { useState, useEffect } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function InstallPwaButton() {
    const { t } = useTranslation();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Check if already installed
        const isInstalled = window.matchMedia('(display-mode: standalone)').matches 
            || (window.navigator as any).standalone === true;
        
        setIsStandalone(isInstalled);

        // Check if mobile device
        const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsMobile(mobileCheck);

        if (isInstalled || !mobileCheck) return;

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleClick = async () => {
        if (deferredPrompt) {
            // Chrome/Android с поддержкой install prompt
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else {
            // Fallback - показать инструкции
            setShowInstructions(true);
        }
    };

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    // Don't show if already installed or not mobile
    if (isStandalone || !isMobile) return null;

    return (
        <>
            <button
                onClick={handleClick}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: deferredPrompt ? 'var(--accent-color)' : 'transparent',
                    color: deferredPrompt ? '#fff' : 'var(--text-color)',
                    border: deferredPrompt ? 'none' : '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: deferredPrompt ? 'bold' : 'normal',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                    if (!deferredPrompt) e.currentTarget.style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                    if (!deferredPrompt) e.currentTarget.style.background = 'transparent';
                }}
            >
                {isIOS ? <Share size={18} /> : <Download size={18} />}
                <span>{t('common.installApp')}</span>
            </button>

            {/* Instructions Modal */}
            {showInstructions && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '1rem'
                    }}
                    onClick={() => setShowInstructions(false)}
                >
                    <div
                        style={{
                            background: 'var(--bg-color, #1e293b)',
                            borderRadius: '1rem',
                            padding: '2rem',
                            maxWidth: '400px',
                            width: '100%',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowInstructions(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-color)',
                                padding: '0.5rem'
                            }}
                        >
                            <X size={24} />
                        </button>

                        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
                            {isIOS ? t('pwa.iosTitle') : t('pwa.androidTitle')}
                        </h3>

                        <div style={{ lineHeight: '1.6' }}>
                            {isIOS ? (
                                <>
                                    <p>{t('pwa.iosInstructions')}</p>
                                    <div style={{ 
                                        marginTop: '1rem', 
                                        padding: '1rem', 
                                        background: 'var(--bg-secondary, #334155)',
                                        borderRadius: '0.5rem'
                                    }}>
                                        <p style={{ margin: '0.5rem 0' }}>
                                            <strong>1.</strong> Нажмите кнопку <Share size={16} style={{ verticalAlign: 'middle' }} /> <strong>Поделиться</strong> внизу экрана
                                        </p>
                                        <p style={{ margin: '0.5rem 0' }}>
                                            <strong>2.</strong> Прокрутите вниз и выберите <strong>«На экран «Домой»»</strong>
                                        </p>
                                        <p style={{ margin: '0.5rem 0' }}>
                                            <strong>3.</strong> Нажмите <strong>«Добавить»</strong>
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p>{t('pwa.androidInstructions')}</p>
                                    <div style={{ 
                                        marginTop: '1rem', 
                                        padding: '1rem', 
                                        background: 'var(--bg-secondary, #334155)',
                                        borderRadius: '0.5rem'
                                    }}>
                                        <p style={{ margin: '0.5rem 0' }}>
                                            <strong>1.</strong> Нажмите меню браузера (⋮) в правом верхнем углу
                                        </p>
                                        <p style={{ margin: '0.5rem 0' }}>
                                            <strong>2.</strong> Выберите <strong>«Установить приложение»</strong> или <strong>«Добавить на главный экран»</strong>
                                        </p>
                                        <p style={{ margin: '0.5rem 0' }}>
                                            <strong>3.</strong> Подтвердите установку
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={() => setShowInstructions(false)}
                            style={{
                                marginTop: '1.5rem',
                                width: '100%',
                                padding: '0.75rem',
                                background: 'var(--accent-color)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '1rem'
                            }}
                        >
                            {t('common.close') || 'Понятно'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
