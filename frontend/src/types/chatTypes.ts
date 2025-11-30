export interface Message {
    id: number;
    conversationId: number;
    senderId: string;
    senderName: string;
    content: string;
    sentAt: string;
    isRead: boolean;
    isDeleted: boolean;
}

export interface Conversation {
    id: number;
    createdAt: string;
    lastMessageAt?: string;
    participants: Participant[];
    messages: Message[];
    isBlocked: boolean;
    isBlockedByOther: boolean;
    isGlobal: boolean;
}

export interface ConversationListItem {
    id: number;
    otherUserId: string;
    otherUserName: string;
    otherUserEmail: string;
    lastMessage?: string;
    lastMessageAt?: string;
    unreadCount: number;
    isOtherUserOnline: boolean;
    otherUserLastSeen?: string;
    isBlocked: boolean;
    isGlobal: boolean;
    onlineCount: number;
}

export interface Participant {
    userId: string;
    userName: string;
    email: string;
    joinedAt: string;
}

export interface UserSearchResult {
    id: string;
    name: string;
    email: string;
}

export interface SendMessageRequest {
    conversationId: number;
    content: string;
}

export interface CreateConversationRequest {
    participantEmail: string;
}
