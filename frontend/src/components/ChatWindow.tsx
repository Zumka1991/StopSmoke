import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../types/chatTypes';
import { Send, ArrowLeft, MoreVertical, Ban, Trash2, Eraser, Unlock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatWindowProps {
    conversationId: number;
    messages: Message[];
    otherUserName: string;
    isOtherUserOnline: boolean;
    currentUserId: string;
    isBlocked: boolean;
    isBlockedByOther: boolean;
    onSendMessage: (content: string) => void;
    onBack?: () => void;
    onLoadOlderMessages?: () => Promise<boolean | void>;
    onBlock: () => void;
    onUnblock: () => void;
    onClearHistory: () => void;
    onDeleteConversation: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
    conversationId,
    messages,
    otherUserName,
    isOtherUserOnline,
    currentUserId,
    isBlocked,
    isBlockedByOther,
    onSendMessage,
    onBack,
    onLoadOlderMessages,
    onBlock,
    onUnblock,
    onClearHistory,
    onDeleteConversation,
}) => {
    const { t } = useTranslation();
    const [messageInput, setMessageInput] = useState('');
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const previousScrollHeightRef = useRef<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-focus input when component mounts or conversation changes
    useEffect(() => {
        if (!isBlocked && !isBlockedByOther) {
            inputRef.current?.focus();
        }
        // Reset hasMoreMessages when conversation changes
        setHasMoreMessages(true);
        setShowMenu(false);
    }, [conversationId, isBlocked, isBlockedByOther]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
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
            previousScrollHeightRef.current = container.scrollHeight;

            const hasMore = await onLoadOlderMessages();

            setIsLoadingOlder(false);

            // Update hasMoreMessages flag based on result
            if (hasMore === false) {
                setHasMoreMessages(false);
            }

            // Maintain scroll position after loading
            if (hasMore) {
                const newScrollHeight = container.scrollHeight;
                container.scrollTop = newScrollHeight - previousScrollHeightRef.current;
            }
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (messageInput.trim()) {
            onSendMessage(messageInput.trim());
            setMessageInput('');
        }
    };

    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                    <div className="chat-window-avatar">
                        {otherUserName.charAt(0).toUpperCase()}
                    </div>
                    <div className="chat-window-user-info">
                        <h3>{otherUserName}</h3>
                        <span className={`status ${isOtherUserOnline ? 'online' : 'offline'}`}>
                            {isOtherUserOnline ? t('messages.online') : t('messages.offline')}
                        </span>
                    </div>
                </div>

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
                        >
                            <div className="message-content">
                                <p>{message.content}</p>
                                <span className="message-time">{formatMessageTime(message.sentAt)}</span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {isBlocked ? (
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
            ) : isBlockedByOther ? (
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
                    <button type="submit" disabled={!messageInput.trim()}>
                        <Send size={20} />
                    </button>
                </form>
            )}
        </div>
    );
};

export default ChatWindow;
