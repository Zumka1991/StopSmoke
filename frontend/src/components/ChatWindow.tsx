import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../types/chatTypes';
import { Send, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatWindowProps {
    conversationId: number;
    messages: Message[];
    otherUserName: string;
    isOtherUserOnline: boolean;
    currentUserId: string;
    onSendMessage: (content: string) => void;
    onBack?: () => void;
    onLoadOlderMessages?: () => Promise<boolean | void>;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
    conversationId,
    messages,
    otherUserName,
    isOtherUserOnline,
    currentUserId,
    onSendMessage,
    onBack,
    onLoadOlderMessages,
}) => {
    const { t } = useTranslation();
    const [messageInput, setMessageInput] = useState('');
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const previousScrollHeightRef = useRef<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-focus input when component mounts or conversation changes
    useEffect(() => {
        inputRef.current?.focus();
        // Reset hasMoreMessages when conversation changes
        setHasMoreMessages(true);
    }, [conversationId]);

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
                {messages.map((message) => (
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
                ))}
                <div ref={messagesEndRef} />
            </div>

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
        </div>
    );
};

export default ChatWindow;
