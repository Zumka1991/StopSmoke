import { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { signalRService } from '../api/signalrService';
import api from '../api/axios';

export const GlobalNotificationListener: React.FC = () => {
    const { setUnreadCount, playNotificationSound } = useNotifications();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
            return;
        }

        // Initialize SignalR connection
        const initSignalR = async () => {
            try {
                await signalRService.start(token);
                console.log('Global SignalR listener connected');

                // Listen for new messages
                signalRService.onReceiveMessage(() => {
                    // Play notification sound if not on messages page or not in active conversation
                    const isOnMessagesPage = window.location.pathname === '/messages';
                    if (!isOnMessagesPage) {
                        playNotificationSound();
                    }

                    // Update unread count
                    loadUnreadCount();
                });
            } catch (error) {
                console.error('Failed to initialize global SignalR listener:', error);
            }
        };

        const loadUnreadCount = async () => {
            try {
                const response = await api.get('/messages/conversations');
                const totalUnread = response.data.reduce((sum: number, conv: any) =>
                    sum + conv.unreadCount, 0
                );
                setUnreadCount(totalUnread);
            } catch (error) {
                console.error('Error loading unread count:', error);
            }
        };

        // Load initial unread count
        loadUnreadCount();

        // Initialize SignalR
        initSignalR();

        // Cleanup
        return () => {
            // Don't stop SignalR here as it might be used by MessagesPage
        };
    }, [setUnreadCount, playNotificationSound]);

    return null; // This component doesn't render anything
};
