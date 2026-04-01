import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../types/chatTypes';
import { Send, ArrowLeft, MoreVertical, Ban, Trash2, Eraser, Unlock, Globe, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import OnlineUsersModal from './OnlineUsersModal';
import { signalRService } from '../api/signalrService';
import type { UserSummary } from '../types/chatTypes';

interface ChatWindowProps {
    conversationId: number;
    messages: Message[];
    otherUserName: string;
    otherUserId?: string;
    otherUserAvatarUrl?: string;
    otherUserAvatarThumbnailUrl?: string;
    isOtherUserOnline: boolean;
    currentUserId: string;
    isBlocked: boolean;
    isBlockedByOther: boolean;
    isGlobal: boolean;
    onlineCount?: number;
    onSendMessage: (content: string, replyToId?: number) => void;
    onBack?: () => void;
    onLoadOlderMessages?: () => Promise<boolean | void>;
    onBlock: () => void;
    onUnblock: () => void;
    onClearHistory: () => void;
    onDeleteConversation: () => void;
    onDeleteMessage: (messageId: number) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
    conversationId,
    messages,
    otherUserName,
    otherUserId,
    otherUserAvatarUrl,
    otherUserAvatarThumbnailUrl,
    isOtherUserOnline,
    currentUserId,
    isBlocked,
    isBlockedByOther,
    isGlobal,
    onlineCount = 0,
    onSendMessage,
    onBack,
    onLoadOlderMessages,
    onBlock,
    onUnblock,
    onClearHistory,
    onDeleteConversation,
    onDeleteMessage,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [messageInput, setMessageInput] = useState('');
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [messageContextMenu, setMessageContextMenu] = useState<{
        messageId: number;
        x: number;
        y: number;
        senderId?: string;
    } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const previousScrollHeightRef = useRef<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const messageMenuRef = useRef<HTMLDivElement>(null);
    const previousMessageCountRef = useRef<number>(0);
    const isLoadingOlderRef = useRef<boolean>(false);
    const lastMessageTimeRef = useRef<number>(0);
    const [canSendMessage, setCanSendMessage] = useState(true);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const [isSharingDuration, setIsSharingDuration] = useState(false);
    const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
    const [isOnlineUsersModalOpen, setIsOnlineUsersModalOpen] = useState(false);
    const [onlineUsersList, setOnlineUsersList] = useState<UserSummary[]>([]);
    const [isLoadingOnlineUsers, setIsLoadingOnlineUsers] = useState(false);
    const cooldownIntervalRef = useRef<number | null>(null);
    const longPressTimerRef = useRef<number | null>(null);
    const longPressTargetRef = useRef<{ messageId: number; senderId: string; x: number; y: number } | null>(null);

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        // Only scroll to bottom if:
        // 1. New messages were added at the end (not loading older messages)
        // 2. Or it's the initial load
        const currentCount = messages.length;
        const previousCount = previousMessageCountRef.current;

        if (currentCount > previousCount && !isLoadingOlderRef.current) {
            // Use instant scroll for initial load, smooth for new messages
            const isInitialLoad = previousCount === 0 && currentCount > 0;
            scrollToBottom(isInitialLoad ? 'auto' : 'smooth');
        }

        previousMessageCountRef.current = currentCount;
    }, [messages]);

    // Auto-focus input when component mounts or conversation changes
    useEffect(() => {
        if (!isBlocked && !isBlockedByOther) {
            inputRef.current?.focus();
        }
        // Reset hasMoreMessages when conversation changes
        setHasMoreMessages(true);
        setShowMenu(false);
        // Reset message count to allow initial scroll to bottom
        previousMessageCountRef.current = 0;
        isLoadingOlderRef.current = false;
        // Reset cooldown
        lastMessageTimeRef.current = 0;
        setCanSendMessage(true);
        setCooldownRemaining(0);
        if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
            cooldownIntervalRef.current = null;
        }
    }, [conversationId, isBlocked, isBlockedByOther]);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (cooldownIntervalRef.current) {
                clearInterval(cooldownIntervalRef.current);
            }
        };
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
            if (messageMenuRef.current && !messageMenuRef.current.contains(event.target as Node)) {
                setMessageContextMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;

        // Check if scrolled to top (with 50px threshold)
        // Only attempt to load if we haven't reached the end of message history
        if (container.scrollTop < 50 && !isLoadingOlder && hasMoreMessages && onLoadOlderMessages) {
            setIsLoadingOlder(true);
            isLoadingOlderRef.current = true;
            previousScrollHeightRef.current = container.scrollHeight;

            const hasMore = await onLoadOlderMessages();

            // Wait a frame for messages to be rendered
            requestAnimationFrame(() => {
                // Update hasMoreMessages flag based on result
                if (hasMore === false) {
                    setHasMoreMessages(false);
                }

                // Maintain scroll position after loading
                if (hasMore && messagesContainerRef.current) {
                    const newScrollHeight = messagesContainerRef.current.scrollHeight;
                    messagesContainerRef.current.scrollTop = newScrollHeight - previousScrollHeightRef.current;
                }

                setIsLoadingOlder(false);

                // Reset the ref after another frame to ensure useEffect has processed
                requestAnimationFrame(() => {
                    isLoadingOlderRef.current = false;
                });
            });
        }
    };

    const startCooldown = () => {
        if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
        }
        
        setCanSendMessage(false);
        setCooldownRemaining(3);

        cooldownIntervalRef.current = window.setInterval(() => {
            setCooldownRemaining((prev) => {
                if (prev <= 1) {
                    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
                    setCanSendMessage(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleShareDuration = async () => {
        setIsSharingDuration(true);
        try {
            const response = await api.get('/profile');
            const data = response.data;
            
            let days = 0;
            if (data.quitDate) {
                const quit = new Date(data.quitDate).getTime();
                const now = new Date().getTime();
                days = Math.floor(Math.max(0, now - quit) / (1000 * 60 * 60 * 24));
            }

            const payload = JSON.stringify({
                days,
                marathons: data.completedMarathonsCount || 0
            });
            
            onSendMessage(`[APP_META:QUIT_SHARE]${payload}`);
            startCooldown();
            scrollToBottom();
        } catch (err) {
            console.error('Failed to share duration', err);
        } finally {
            setIsSharingDuration(false);
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (!messageInput.trim() || !canSendMessage) return;

        const now = Date.now();
        const timeSinceLastMessage = now - lastMessageTimeRef.current;
        const COOLDOWN_MS = 2000; // 2 seconds between messages

        if (timeSinceLastMessage < COOLDOWN_MS && lastMessageTimeRef.current > 0) {
            // Still in cooldown - just show the remaining time
            return;
        }

        // Send message
        onSendMessage(messageInput.trim(), replyingToMessage?.id);
        setMessageInput('');
        setReplyingToMessage(null);
        lastMessageTimeRef.current = now;

        // Start cooldown
        startCooldown();
    };

    const handleLongPressStart = (e: React.TouchEvent, messageId: number, senderId: string) => {
        const touch = e.touches[0];
        longPressTargetRef.current = { messageId, senderId, x: touch.clientX, y: touch.clientY };
        longPressTimerRef.current = window.setTimeout(() => {
            if (longPressTargetRef.current) {
                const { messageId: mid, senderId: sid, x, y } = longPressTargetRef.current;
                // Show context menu for own messages on delete, for all messages on reply
                setMessageContextMenu({ messageId: mid, x, y, senderId: sid });
            }
        }, 500);
    };

    const handleLongPressEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
        longPressTargetRef.current = null;
    };

    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Today - show only time
        if (messageDate.getTime() === today.getTime()) {
            return time;
        }

        // Yesterday - show "Yesterday" + time
        if (messageDate.getTime() === yesterday.getTime()) {
            return `${t('messages.yesterday')}, ${time}`;
        }

        // This year - show date without year
        if (date.getFullYear() === now.getFullYear()) {
            const dateStr = date.toLocaleDateString([], { day: 'numeric', month: 'short' });
            return `${dateStr}, ${time}`;
        }

        // Previous years - show full date with year
        const dateStr = date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
        return `${dateStr}, ${time}`;
    };

    const scrollToMessage = (messageId: number) => {
        const el = messagesContainerRef.current?.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Flash highlight
        el.classList.add('message-highlight');
        setTimeout(() => el.classList.remove('message-highlight'), 1500);
    };

    const handleOpenOnlineUsers = async () => {
        if (!isGlobal || isLoadingOnlineUsers) return;
        
        setIsLoadingOnlineUsers(true);
        try {
            const users = await signalRService.getOnlineUsersDetails();
            setOnlineUsersList(users);
            setIsOnlineUsersModalOpen(true);
        } catch (error) {
            console.error('Error fetching online users:', error);
        } finally {
            setIsLoadingOnlineUsers(false);
        }
    };

    const handleMessageContextMenu = (e: React.MouseEvent, messageId: number, senderId: string) => {
        e.preventDefault();
        setMessageContextMenu({
            messageId,
            x: e.clientX,
            y: e.clientY,
            senderId,
        });
    };

    const handleReplyMessage = () => {
        if (messageContextMenu) {
            const msg = messages.find(m => m.id === messageContextMenu.messageId);
            if (msg) {
                setReplyingToMessage(msg);
                inputRef.current?.focus();
            }
        }
        setMessageContextMenu(null);
    };

    const handleDeleteMessage = () => {
        if (messageContextMenu) {
            if (window.confirm(t('messages.confirmDeleteMessage'))) {
                onDeleteMessage(messageContextMenu.messageId);
                setMessageContextMenu(null);
            }
        }
    };

    return (
        <div className="chat-window">
            <div className="chat-window-header">
                {onBack && (
                    <button className="chat-back-button" onClick={onBack}>
                        <ArrowLeft size={24} />
                    </button>
                )}
                <div className="chat-window-user">
                    <div 
                        className={`chat-window-avatar ${isGlobal ? 'global' : ''}`}
                        onClick={() => {
                            if (!isGlobal && otherUserId) {
                                navigate(`/profile/${otherUserId}`);
                            }
                        }}
                        style={{ 
                            cursor: isGlobal ? 'default' : 'pointer',
                            ...(!isGlobal && (otherUserAvatarThumbnailUrl || otherUserAvatarUrl) ? {
                                background: `url(${otherUserAvatarThumbnailUrl || otherUserAvatarUrl}) center/cover`,
                                color: 'transparent'
                            } : {})
                        }}
                        title={!isGlobal ? (t('profile.viewProfile') || 'View Profile') : undefined}
                    >
                        {isGlobal && <Globe size={24} />}
                        {!isGlobal && !otherUserAvatarThumbnailUrl && !otherUserAvatarUrl && otherUserName.charAt(0).toUpperCase()}
                    </div>
                    <div className="chat-window-user-info">
                        <h3
                            onClick={() => {
                                if (!isGlobal && otherUserId) {
                                    navigate(`/profile/${otherUserId}`);
                                }
                            }}
                            style={{ 
                                cursor: isGlobal ? 'default' : 'pointer'
                            }}
                            title={!isGlobal ? (t('profile.viewProfile') || 'View Profile') : undefined}
                        >
                            {isGlobal ? t('messages.globalChat') : otherUserName}
                        </h3>
                        <span 
                            className={`status ${isGlobal || isOtherUserOnline ? 'online' : 'offline'}`}
                            onClick={handleOpenOnlineUsers}
                            style={{ cursor: isGlobal ? 'pointer' : 'default' }}
                        >
                            {isGlobal
                                ? `${onlineCount} ${t('messages.online').toLowerCase()}`
                                : isOtherUserOnline
                                    ? t('messages.online')
                                    : t('messages.offline')}
                        </span>
                    </div>
                </div>

                {!isGlobal && (
                    <div className="chat-window-actions" ref={menuRef} style={{ position: 'relative' }}>
                        <button
                            className="chat-menu-button"
                            onClick={() => setShowMenu(!showMenu)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                transition: 'background 0.2s'
                            }}
                        >
                            <MoreVertical size={24} />
                        </button>

                        {showMenu && (
                            <div className="chat-menu-dropdown" style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                background: 'var(--card-bg)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '0.5rem',
                                padding: '0.5rem',
                                minWidth: '200px',
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                                zIndex: 100
                            }}>
                                <button
                                    onClick={() => {
                                        isBlocked ? onUnblock() : onBlock();
                                        setShowMenu(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontSize: '0.9rem',
                                        borderRadius: '0.25rem'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    {isBlocked ? <Unlock size={18} /> : <Ban size={18} />}
                                    {isBlocked ? t('messages.unblock') : t('messages.block')}
                                </button>

                                <button
                                    onClick={() => {
                                        if (window.confirm(t('messages.confirmClearHistory'))) {
                                            onClearHistory();
                                            setShowMenu(false);
                                        }
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontSize: '0.9rem',
                                        borderRadius: '0.25rem'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <Eraser size={18} />
                                    {t('messages.clearHistory')}
                                </button>

                                <button
                                    onClick={() => {
                                        if (window.confirm(t('messages.confirmDeleteConversation'))) {
                                            onDeleteConversation();
                                            setShowMenu(false);
                                        }
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--error-color)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontSize: '0.9rem',
                                        borderRadius: '0.25rem'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <Trash2 size={18} />
                                    {t('messages.deleteConversation')}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div
                className="chat-window-messages"
                ref={messagesContainerRef}
                onScroll={handleScroll}
            >
                {isLoadingOlder && (
                    <div style={{
                        textAlign: 'center',
                        padding: '1rem',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem'
                    }}>
                        {t('messages.loadingOlder')}...
                    </div>
                )}
                {messages.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'var(--text-secondary)',
                        opacity: 0.5
                    }}>
                        <p>{t('messages.noMessages')}</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            data-message-id={message.id}
                            className={`message ${message.senderId === currentUserId ? 'message-sent' : 'message-received'
                                }`}
                            onContextMenu={(e) => handleMessageContextMenu(e, message.id, message.senderId)}
                            onTouchStart={(e) => handleLongPressStart(e, message.id, message.senderId)}
                            onTouchEnd={handleLongPressEnd}
                            onTouchMove={handleLongPressEnd}
                            style={{ cursor: message.senderId === currentUserId && !message.isDeleted ? 'context-menu' : 'default' }}
                        >
                                {isGlobal && message.senderId !== currentUserId && (
                                    <div className="message-avatar-container">
                                        {(message.senderAvatarThumbnailUrl || message.senderAvatarUrl) ? (
                                            <img 
                                                src={message.senderAvatarThumbnailUrl || message.senderAvatarUrl} 
                                                className="message-avatar"
                                                alt={message.senderName}
                                                onClick={() => navigate(`/profile/${message.senderId}`)}
                                                title={t('profile.viewProfile') || 'View Profile'}
                                            />
                                        ) : (
                                            <div 
                                                className="message-avatar-placeholder"
                                                onClick={() => navigate(`/profile/${message.senderId}`)}
                                                title={t('profile.viewProfile') || 'View Profile'}
                                            >
                                                {message.senderName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="message-content">
                                    {/* Reply quote */}
                                    {message.replyToId && !message.isDeleted && (
                                        <div
                                            onClick={() => message.replyToId && scrollToMessage(message.replyToId)}
                                            style={{
                                                borderLeft: '3px solid rgba(255,255,255,0.5)',
                                                paddingLeft: '0.5rem',
                                                marginBottom: '0.4rem',
                                                opacity: 0.75,
                                                fontSize: '0.8rem',
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap',
                                                textOverflow: 'ellipsis',
                                                maxWidth: '280px',
                                                cursor: 'pointer',
                                                borderRadius: '0 4px 4px 0',
                                                padding: '0.2rem 0.5rem',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <span style={{ fontWeight: 'bold', display: 'block' }}>
                                                {message.replyToSenderName}
                                            </span>
                                            <span style={{ opacity: 0.85 }}>
                                                {message.replyToContent
                                                    ? (message.replyToContent.startsWith('[APP_META:QUIT_SHARE]')
                                                        ? '🏆 ' + (t('profile.sharedDuration') || 'Поделился сроком отказа')
                                                        : message.replyToContent.slice(0, 80))
                                                    : t('messages.deletedMessage')}
                                            </span>
                                        </div>
                                    )}
                                    {isGlobal && message.senderId !== currentUserId && (
                                        <span 
                                            className="message-sender-name"
                                            onClick={() => navigate(`/profile/${message.senderId}`)}
                                            style={{ cursor: 'pointer', margin: '0 0 0.25rem 0' }}
                                            title={t('profile.viewProfile') || 'View Profile'}
                                        >
                                            {message.senderName}
                                        </span>
                                    )}
                                {message.isDeleted ? (
                                    <p style={{
                                        fontStyle: 'italic',
                                        opacity: 0.9,
                                        color: 'rgba(255, 255, 255, 0.8)'
                                    }}>
                                        {t('messages.deletedMessage')}
                                    </p>
                                ) : message.content.startsWith('[APP_META:QUIT_SHARE]') ? (
                                    (() => {
                                        try {
                                            const data = JSON.parse(message.content.replace('[APP_META:QUIT_SHARE]', ''));
                                            return (
                                                <div style={{
                                                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.2))',
                                                    padding: '1rem',
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(251, 191, 36, 0.3)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.5rem',
                                                    minWidth: '220px',
                                                    marginTop: '0.25rem',
                                                    color: 'white'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: '#fbbf24' }}>
                                                        <Trophy size={18} />
                                                        {t('profile.myProgress') || 'Мой прогресс'}
                                                    </div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                        {t('profile.smokeFree') || 'Не курю'} {data.days} {t('profile.days') || 'дней'}!
                                                    </div>
                                                    {data.marathons > 0 && (
                                                        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                                                            {t('profile.completedMarathons') || 'Пройдено марафонов'}: {data.marathons}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        } catch {
                                            return <p>{message.content}</p>;
                                        }
                                    })()
                                ) : (
                                    <p>{message.content}</p>
                                )}
                                <span className="message-time">{formatMessageTime(message.sentAt)}</span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Context Menu */}
            {messageContextMenu && (
                <div
                    ref={messageMenuRef}
                    style={{
                        position: 'fixed',
                        top: messageContextMenu.y,
                        left: messageContextMenu.x,
                        background: 'var(--card-bg)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.5rem',
                        padding: '0.5rem',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                        zIndex: 1000,
                        minWidth: '180px'
                    }}
                >
                    {/* Reply button - always visible */}
                    <button
                        onClick={handleReplyMessage}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            width: '100%',
                            padding: '0.75rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '0.9rem',
                            borderRadius: '0.25rem',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        ↩️ {t('messages.replyMessage') || 'Ответить'}
                    </button>
                    {/* Delete button - only own messages */}
                    {messageContextMenu?.senderId === currentUserId && (
                        <button
                            onClick={handleDeleteMessage}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                width: '100%',
                                padding: '0.75rem',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--error-color)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontSize: '0.9rem',
                                borderRadius: '0.25rem',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <Trash2 size={18} />
                            {t('messages.deleteMessage')}
                        </button>
                    )}
                </div>
            )}

            {/* Reply preview bar */}
            {replyingToMessage && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--accent-color)' }}>
                            ↩️ {replyingToMessage.senderName}
                        </span>
                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {replyingToMessage.content.startsWith('[APP_META:QUIT_SHARE]')
                                ? '🏆 ' + (t('profile.sharedDuration') || 'Поделился сроком отказа')
                                : replyingToMessage.content.slice(0, 100)}
                        </p>
                    </div>
                    <button
                        onClick={() => setReplyingToMessage(null)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
                        title="Отменить ответ"
                    >✕</button>
                </div>
            )}

            {!isGlobal && isBlocked ? (
                <div className="chat-window-input" style={{ justifyContent: 'center' }}>
                    <button
                        onClick={onUnblock}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--accent-color)',
                            borderRadius: '0.5rem',
                            color: 'var(--accent-color)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Unlock size={18} />
                        {t('messages.unblockUser')}
                    </button>
                </div>
            ) : !isGlobal && isBlockedByOther ? (
                <div className="chat-window-input" style={{ justifyContent: 'center' }}>
                    <p style={{ color: 'var(--error-color)', margin: 0 }}>
                        {t('messages.cannotSendMessage')}
                    </p>
                </div>
            ) : (
                <form className="chat-window-input" onSubmit={handleSendMessage}>
                    <button
                        type="button"
                        onClick={handleShareDuration}
                        disabled={!canSendMessage || isSharingDuration}
                        className="chat-share-btn"
                        style={{
                            background: 'transparent',
                            color: '#fbbf24',
                            border: 'none',
                            cursor: canSendMessage && !isSharingDuration ? 'pointer' : 'default',
                            opacity: !canSendMessage || isSharingDuration ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.2s',
                        }}
                        title={t('profile.shareDuration') || 'Поделиться сроком'}
                    >
                        <Trophy size={20} />
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder={t('messages.typeMessage')}
                        maxLength={2000}
                    />
                    <button
                        type="submit"
                        disabled={!messageInput.trim() || !canSendMessage}
                        style={{
                            position: 'relative',
                            opacity: !canSendMessage ? 0.6 : 1
                        }}
                    >
                        {cooldownRemaining > 0 ? (
                            <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{cooldownRemaining}</span>
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </form>
            )}

            <OnlineUsersModal 
                isOpen={isOnlineUsersModalOpen} 
                onClose={() => setIsOnlineUsersModalOpen(false)} 
                users={onlineUsersList} 
            />
        </div>
    );
};

export default ChatWindow;
