import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../types/chatTypes';
import { Send, ArrowLeft, MoreVertical, Ban, Trash2, Eraser, Unlock, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatWindowProps {
    conversationId: number;
    messages: Message[];
    otherUserName: string;
    isOtherUserOnline: boolean;
    currentUserId: string;
    isBlocked: boolean;
    isBlockedByOther: boolean;
    isGlobal: boolean;
    onlineCount?: number;
    onSendMessage: (content: string) => void;
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
    const [messageInput, setMessageInput] = useState('');
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [messageContextMenu, setMessageContextMenu] = useState<{
        messageId: number;
        x: number;
        y: number;
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
    const cooldownIntervalRef = useRef<number | null>(null);

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
        const COOLDOWN_MS = 2000; // 2 seconds between messages

        // Clear any existing interval
        if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
        }

        setCanSendMessage(false);
        setCooldownRemaining(Math.ceil(COOLDOWN_MS / 1000));

        cooldownIntervalRef.current = setInterval(() => {
            const timeLeft = Math.ceil((COOLDOWN_MS - (Date.now() - lastMessageTimeRef.current)) / 1000);
            if (timeLeft <= 0) {
                setCooldownRemaining(0);
                setCanSendMessage(true);
                if (cooldownIntervalRef.current) {
                    clearInterval(cooldownIntervalRef.current);
                    cooldownIntervalRef.current = null;
                }
            } else {
                setCooldownRemaining(timeLeft);
            }
        }, 100);
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
        onSendMessage(messageInput.trim());
        setMessageInput('');
        lastMessageTimeRef.current = now;

        // Start cooldown
        startCooldown();
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

    const handleMessageContextMenu = (e: React.MouseEvent, messageId: number, senderId: string) => {
        // Only show context menu for own messages
        if (senderId !== currentUserId) return;

        e.preventDefault();
        setMessageContextMenu({
            messageId,
            x: e.clientX,
            y: e.clientY
        });
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
                    <div className={`chat-window-avatar ${isGlobal ? 'global' : ''}`}>
                        {isGlobal ? (
                            <Globe size={24} />
                        ) : (
                            otherUserName.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="chat-window-user-info">
                        <h3>{isGlobal ? t('messages.globalChat') : otherUserName}</h3>
                        <span className={`status ${isGlobal || isOtherUserOnline ? 'online' : 'offline'}`}>
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
                            className={`message ${message.senderId === currentUserId ? 'message-sent' : 'message-received'
                                }`}
                            onContextMenu={(e) => handleMessageContextMenu(e, message.id, message.senderId)}
                            style={{ cursor: message.senderId === currentUserId && !message.isDeleted ? 'context-menu' : 'default' }}
                        >
                            <div className="message-content">
                                {isGlobal && message.senderId !== currentUserId && (
                                    <span className="message-sender-name">{message.senderName}</span>
                                )}
                                {message.isDeleted ? (
                                    <p style={{
                                        fontStyle: 'italic',
                                        opacity: 0.9,
                                        color: 'rgba(255, 255, 255, 0.8)'
                                    }}>
                                        {t('messages.deletedMessage')}
                                    </p>
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
        </div>
    );
};

export default ChatWindow;
