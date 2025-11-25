import React, { createContext, useContext, useState, useCallback } from 'react';

interface NotificationContextType {
    unreadCount: number;
    setUnreadCount: (count: number) => void;
    incrementUnread: () => void;
    decrementUnread: (count: number) => void;
    playNotificationSound: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);

    const incrementUnread = useCallback(() => {
        setUnreadCount(prev => prev + 1);
    }, []);

    const decrementUnread = useCallback((count: number) => {
        setUnreadCount(prev => Math.max(0, prev - count));
    }, []);

    const playNotificationSound = useCallback(() => {
        // Create a simple notification sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                unreadCount,
                setUnreadCount,
                incrementUnread,
                decrementUnread,
                playNotificationSound,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};
