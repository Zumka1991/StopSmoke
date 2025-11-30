import React from 'react';
import type { ConversationListItem } from '../types/chatTypes';
import { MessageCircle, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatListProps {
    conversations: ConversationListItem[];
    selectedConversationId: number | null;
    onSelectConversation: (id: number) => void;
}

const ChatList: React.FC<ChatListProps> = ({
    conversations,
    selectedConversationId,
    onSelectConversation,
}) => {
    const { t } = useTranslation();

    const formatTime = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="chat-list">
            {conversations.length === 0 ? (
                <div className="chat-list-empty">
                    <MessageCircle size={48} />
                    <p>No conversations yet</p>
                    <small>Search for users to start chatting</small>
                </div>
            ) : (
                conversations.map((conv) => (
                    <div
                        key={conv.id}
                        className={`chat-list-item ${selectedConversationId === conv.id ? 'active' : ''} ${conv.unreadCount > 0 && selectedConversationId !== conv.id ? 'has-unread' : ''
                            } ${conv.isGlobal ? 'global-chat' : ''}`}
                        onClick={() => onSelectConversation(conv.id)}
                    >
                        <div className={`chat-list-item-avatar ${conv.isGlobal ? 'global' : ''}`}>
                            {conv.isGlobal ? (
                                <Globe size={20} />
                            ) : (
                                conv.otherUserName.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="chat-list-item-content">
                            <div className="chat-list-item-header">
                                <span className="chat-list-item-name">
                                    {conv.isGlobal ? t('messages.globalChat') : conv.otherUserName}
                                    {!conv.isGlobal && conv.isOtherUserOnline && (
                                        <span className="online-indicator"></span>
                                    )}
                                </span>
                                <span className="chat-list-item-time">
                                    {conv.isGlobal
                                        ? `${conv.onlineCount} ${t('messages.online').toLowerCase()}`
                                        : conv.isOtherUserOnline
                                            ? 'Online'
                                            : formatTime(conv.otherUserLastSeen)}
                                </span>
                            </div>
                            <div className="chat-list-item-message">
                                <span className="chat-list-item-preview">
                                    {conv.lastMessage || 'No messages yet'}
                                </span>
                                {conv.unreadCount > 0 && (
                                    <span className="chat-list-item-badge">{conv.unreadCount}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ChatList;
