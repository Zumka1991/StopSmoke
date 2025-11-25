export interface Message {
    id: number;
    conversationId: number;
    senderId: string;
    senderName: string;
    content: string;
    sentAt: string;
    isRead: boolean;
}

export interface Conversation {
    id: number;
    createdAt: string;
    lastMessageAt?: string;
    participants: Participant[];
    messages: Message[];
}

export interface ConversationListItem {
    id: number;
    otherUserName: string;
    otherUserEmail: string;
    lastMessage?: string;
    lastMessageAt?: string;
    unreadCount: number;
    isOtherUserOnline: boolean;
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
