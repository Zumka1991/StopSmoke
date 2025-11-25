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
}

const ChatWindow: React.FC<ChatWindowProps> = ({
    messages,
    otherUserName,
    isOtherUserOnline,
    currentUserId,
    onSendMessage,
    onBack,
}) => {
    const { t } = useTranslation();
    const [messageInput, setMessageInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

            <div className="chat-window-messages">
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
