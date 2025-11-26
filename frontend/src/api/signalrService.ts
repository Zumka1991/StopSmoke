import * as signalR from '@microsoft/signalr';
import type { Message } from '../types/chatTypes';

class SignalRService {
    private connection: signalR.HubConnection | null = null;

    async start(token: string): Promise<void> {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl('/chatHub', {
                accessTokenFactory: () => token,
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.connection.onreconnecting(() => {
            console.log('SignalR reconnecting...');
        });

        this.connection.onreconnected(() => {
            console.log('SignalR reconnected!');
        });

        this.connection.onclose((error) => {
            console.log('SignalR connection closed', error);
        });

        try {
            await this.connection.start();
            console.log('SignalR Connected, connection state:', this.connection.state);
        } catch (err) {
            console.error('SignalR Connection Error: ', err);
            throw err;
        }
    }

    async stop(): Promise<void> {
        if (this.connection) {
            await this.connection.stop();
            console.log('SignalR Disconnected');
        }
    }

    async sendMessage(conversationId: number, content: string): Promise<void> {
        if (!this.connection) {
            throw new Error('SignalR connection not established');
        }

        if (this.connection.state !== signalR.HubConnectionState.Connected) {
            throw new Error(`SignalR not connected. Current state: ${this.connection.state}`);
        }

        try {
            console.log('Invoking SendMessage:', { conversationId, content });
            await this.connection.invoke('SendMessage', conversationId, content);
            console.log('SendMessage invoked successfully');
        } catch (err) {
            console.error('Error sending message: ', err);
            throw err;
        }
    }

    async joinConversation(conversationId: number): Promise<void> {
        if (!this.connection) {
            throw new Error('SignalR connection not established');
        }

        try {
            await this.connection.invoke('JoinConversation', conversationId);
        } catch (err) {
            console.error('Error joining conversation: ', err);
            throw err;
        }
    }

    async leaveConversation(conversationId: number): Promise<void> {
        if (!this.connection) {
            throw new Error('SignalR connection not established');
        }

        try {
            await this.connection.invoke('LeaveConversation', conversationId);
        } catch (err) {
            console.error('Error leaving conversation: ', err);
            throw err;
        }
    }

    async markAsRead(conversationId: number): Promise<void> {
        if (!this.connection) {
            throw new Error('SignalR connection not established');
        }

        try {
            await this.connection.invoke('MarkAsRead', conversationId);
        } catch (err) {
            console.error('Error marking as read: ', err);
            throw err;
        }
    }

    async getOnlineUsers(): Promise<string[]> {
        if (!this.connection) {
            throw new Error('SignalR connection not established');
        }

        try {
            return await this.connection.invoke('GetOnlineUsers');
        } catch (err) {
            console.error('Error getting online users: ', err);
            throw err;
        }
    }

    onReceiveMessage(callback: (message: Message) => void): void {
        if (!this.connection) {
            throw new Error('SignalR connection not established');
        }

        this.connection.on('ReceiveMessage', callback);
    }

    onUserOnline(callback: (userId: string) => void): void {
        if (!this.connection) {
            throw new Error('SignalR connection not established');
        }

        this.connection.on('UserOnline', callback);
    }

    onUserOffline(callback: (userId: string) => void): void {
        if (!this.connection) {
            throw new Error('SignalR connection not established');
        }

        this.connection.on('UserOffline', callback);
    }

    offReceiveMessage(): void {
        if (this.connection) {
            this.connection.off('ReceiveMessage');
        }
    }

    offUserOnline(): void {
        if (this.connection) {
            this.connection.off('UserOnline');
        }
    }

    offUserOffline(): void {
        if (this.connection) {
            this.connection.off('UserOffline');
        }
    }

    isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }
}

export const signalRService = new SignalRService();
