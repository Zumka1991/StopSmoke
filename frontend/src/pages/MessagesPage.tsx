import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { signalRService } from '../api/signalrService';
import Navbar from '../components/Navbar';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import UserSearch from '../components/UserSearch';
import type { ConversationListItem, Conversation, Message } from '../types/chatTypes';
import { MessageCircle } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

const MessagesPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState<ConversationListItem[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [showMobileSidebar, setShowMobileSidebar] = useState(true);
    const { setUnreadCount, playNotificationSound } = useNotifications();

    // Use refs to avoid stale closures in SignalR callbacks
    const selectedConversationIdRef = useRef<number | null>(null);
    const currentConversationRef = useRef<Conversation | null>(null);

    useEffect(() => {
        selectedConversationIdRef.current = selectedConversationId;
        currentConversationRef.current = currentConversation;
    }, [selectedConversationId, currentConversation]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
            navigate('/login');
            return;
        }

        setCurrentUserId(userId);
        initializeSignalR(token);
        loadConversations();

        return () => {
            signalRService.offReceiveMessage();
            signalRService.offUserOnline();
            signalRService.offUserOffline();
            signalRService.stop();
        };
    }, [navigate]);

    const initializeSignalR = async (token: string) => {
        try {
            await signalRService.start(token);
            console.log('SignalR connected successfully');

            signalRService.onReceiveMessage((message: Message) => {
                console.log('Received message:', message);

                // Play notification sound if:
                // 1. Message is not in currently active conversation
                // 2. Or user is not on messages page
                const isOnMessagesPage = window.location.pathname === '/messages';
                const isActiveConversation = selectedConversationIdRef.current === message.conversationId;

                if (!isOnMessagesPage || !isActiveConversation) {
                    playNotificationSound();
                }

                // Update current conversation if it's the active one
                if (selectedConversationIdRef.current === message.conversationId) {
                    setCurrentConversation((prev) => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            messages: [...prev.messages, message],
                        };
                    });

                    // Mark as read
                    signalRService.markAsRead(message.conversationId);
                }

                // Always reload conversations list to update last message
                loadConversations();
            });

            signalRService.onUserOnline((userId: string) => {
                console.log('User online:', userId);
                updateUserOnlineStatus(userId, true);
            });

            signalRService.onUserOffline((userId: string) => {
                console.log('User offline:', userId);
                updateUserOnlineStatus(userId, false);
            });
        } catch (error) {
            console.error('Failed to initialize SignalR:', error);
            // Don't show alert on initial connection failure - it will retry automatically
        }
    };

    const loadConversations = async () => {
        try {
            const response = await api.get('/messages/conversations');
            setConversations(response.data);

            // Calculate total unread count
            const totalUnread = response.data.reduce((sum: number, conv: ConversationListItem) =>
                sum + conv.unreadCount, 0
            );
            setUnreadCount(totalUnread);
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadConversation = async (id: number) => {
        try {
            const response = await api.get(`/messages/conversations/${id}`);
            setCurrentConversation(response.data);
            setSelectedConversationId(id);
            setShowMobileSidebar(false); // Hide sidebar on mobile when chat is opened

            // Join conversation room
            await signalRService.joinConversation(id);
            console.log('Joined conversation:', id);

            // Mark as read
            await api.put(`/messages/conversations/${id}/read`);
            await signalRService.markAsRead(id);

            // Reload conversations to update unread count
            loadConversations();
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    };

    const loadOlderMessages = async () => {
        if (!currentConversation || currentConversation.messages.length === 0) {
            return;
        }

        try {
            const oldestMessage = currentConversation.messages[0];

            const response = await api.get(
                `/messages/conversations/${currentConversation.id}/messages?beforeMessageId=${oldestMessage.id}&count=50`
            );

            if (response.data.length > 0) {
                setCurrentConversation(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        messages: [...response.data, ...prev.messages]
                    };
                });
                return true; // Indicate that more messages were loaded
            }
            return false; // No more messages
        } catch (error) {
            console.error('Error loading older messages:', error);
            return false;
        }
    };

    const handleSendMessage = async (content: string) => {
        if (!selectedConversationId) return;

        try {
            console.log('Sending message:', content);
            await signalRService.sendMessage(selectedConversationId, content);
        } catch (error) {
            console.error('Error sending message:', error);
            // Show a less intrusive error - could be replaced with a toast notification
            console.warn('Message may not have been delivered. Check your connection.');
        }
    };

    const handleCreateConversation = async (email: string) => {
        try {
            const response = await api.post(
                '/messages/conversations',
                { participantEmail: email }
            );

            const conversationId = response.data.conversationId;
            await loadConversations();
            await loadConversation(conversationId);
        } catch (error) {
            console.error('Error creating conversation:', error);
            alert(t('messages.errorCreatingConversation'));
        }
    };

    const updateUserOnlineStatus = (userId: string, isOnline: boolean) => {
        setConversations((prev) =>
            prev.map((conv) => {
                // Find if this conversation has this user
                const hasUser = currentConversation?.participants.some((p) => p.userId === userId);
                if (hasUser && conv.id === selectedConversationId) {
                    return { ...conv, isOtherUserOnline: isOnline };
                }
                return conv;
            })
        );
    };

    const getOtherUserInfo = () => {
        if (!currentConversation || !currentUserId) return { name: '', isOnline: false };

        const otherParticipant = currentConversation.participants.find(
            (p) => p.userId !== currentUserId
        );

        const conv = conversations.find((c) => c.id === selectedConversationId);

        return {
            name: otherParticipant?.userName || 'Unknown',
            isOnline: conv?.isOtherUserOnline || false,
        };
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
        navigate('/login');
    };

    const handleBackToList = () => {
        setShowMobileSidebar(true);
        setSelectedConversationId(null);
        setCurrentConversation(null);
    };

    if (isLoading) {
        return (
            <>
                <Navbar onLogout={handleLogout} />
                <div className="container" style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <div className="loading">Loading...</div>
                </div>
            </>
        );
    }

    const otherUserInfo = getOtherUserInfo();

    return (
        <>
            <Navbar onLogout={handleLogout} />
            <div className="messages-page-wrapper">
                <div className="container" style={{ maxWidth: '1400px', padding: '0 1rem', height: '100%' }}>
                    <div className="messages-page">
                        <div className={`messages-sidebar ${showMobileSidebar ? 'show' : ''}`}>
                            <div className="messages-sidebar-header">
                                <h2>
                                    <MessageCircle size={24} />
                                    {t('messages.title')}
                                </h2>
                            </div>
                            <UserSearch onCreateConversation={handleCreateConversation} />
                            <ChatList
                                conversations={conversations}
                                selectedConversationId={selectedConversationId}
                                onSelectConversation={loadConversation}
                            />
                        </div>

                        <div className={`messages-main ${!showMobileSidebar ? 'show' : ''}`}>
                            {currentConversation ? (
                                <ChatWindow
                                    conversationId={currentConversation.id}
                                    messages={currentConversation.messages}
                                    otherUserName={otherUserInfo.name}
                                    isOtherUserOnline={otherUserInfo.isOnline}
                                    currentUserId={currentUserId}
                                    onSendMessage={handleSendMessage}
                                    onBack={handleBackToList}
                                    onLoadOlderMessages={loadOlderMessages}
                                />
                            ) : (
                                <div className="messages-empty">
                                    <MessageCircle size={64} />
                                    <h3>{t('messages.selectConversation')}</h3>
                                    <p>{t('messages.selectConversationHint')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MessagesPage;
