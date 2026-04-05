using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using StopSmoke.Backend.Data;
using StopSmoke.Backend.DTOs;
using StopSmoke.Backend.Models;
using System.Collections.Concurrent;
using WebPush;

namespace StopSmoke.Backend.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    // Store multiple connection IDs per user
    private static readonly ConcurrentDictionary<string, HashSet<string>> _onlineUsers = new();

    public ChatHub(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (userId != null)
        {
            _onlineUsers.AddOrUpdate(userId, 
                // Add new user with first connection
                key => new HashSet<string> { Context.ConnectionId }, 
                // Update existing user with new connection
                (key, connections) => 
                {
                    lock (connections)
                    {
                        connections.Add(Context.ConnectionId);
                    }
                    return connections;
                });

            // Notify others only if this is the first connection for the user
            if (_onlineUsers[userId].Count == 1)
            {
                await Clients.All.SendAsync("UserOnline", userId);
            }
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (userId != null)
        {
            if (_onlineUsers.TryGetValue(userId, out var connections))
            {
                lock (connections)
                {
                    connections.Remove(Context.ConnectionId);
                }

                // If no connections left, remove user and notify others
                if (connections.Count == 0)
                {
                    _onlineUsers.TryRemove(userId, out _);

                    // Update LastSeen time
                    var user = await _context.Users.FindAsync(userId);
                    if (user != null)
                    {
                        user.LastSeen = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }

                    await Clients.All.SendAsync("UserOffline", userId);
                }
            }
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(int conversationId, string content, int? replyToId = null)
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId))
        {
            throw new HubException("User not authenticated");
        }

        // Verify user is participant
        var isParticipant = await _context.ConversationParticipants
            .AnyAsync(p => p.ConversationId == conversationId && p.UserId == userId);

        if (!isParticipant)
        {
            throw new HubException("User is not a participant of this conversation");
        }

        // Get conversation to check if it's global
        var conversation = await _context.Conversations.FindAsync(conversationId);
        if (conversation == null)
        {
            throw new HubException("Conversation not found");
        }

        // Load reply-to message if provided
        Models.Message? replyToMessage = null;
        if (replyToId.HasValue)
        {
            replyToMessage = await _context.Messages
                .Include(m => m.Sender)
                .FirstOrDefaultAsync(m => m.Id == replyToId.Value && m.ConversationId == conversationId);
        }

        // Create message
        var message = new Models.Message
        {
            ConversationId = conversationId,
            SenderId = userId,
            Content = content,
            SentAt = DateTime.UtcNow,
            IsRead = false,
            ReplyToId = replyToMessage?.Id
        };

        _context.Messages.Add(message);

        // Update conversation last message time
        conversation.LastMessageAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Load sender info
        var sender = await _context.Users.FindAsync(userId);

        var messageResponse = new MessageResponse
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = message.SenderId,
            SenderName = sender?.Name ?? sender?.Email ?? "Unknown",
            SenderAvatarUrl = sender?.AvatarUrl,
            SenderAvatarThumbnailUrl = sender?.AvatarThumbnailUrl,
            Content = message.Content,
            SentAt = message.SentAt,
            IsRead = message.IsRead,
            ReplyToId = replyToMessage?.Id,
            ReplyToSenderName = replyToMessage?.Sender?.Name ?? replyToMessage?.Sender?.Email,
            ReplyToContent = replyToMessage?.IsDeleted == true ? null : replyToMessage?.Content
        };

        if (conversation.IsGlobal)
        {
            // For global chat, broadcast to all connected users
            await Clients.All.SendAsync("ReceiveMessage", messageResponse);
        }
        else
        {
            // For private chat, send only to participants
            var participantIds = await _context.ConversationParticipants
                .Where(p => p.ConversationId == conversationId)
                .Select(p => p.UserId)
                .ToListAsync();

            foreach (var participantId in participantIds)
            {
                // Don't send to the sender
                if (participantId != userId)
                {
                    await Clients.User(participantId).SendAsync("ReceiveMessage", messageResponse);
                    
                    // Send push notification if user is offline
                    await SendPushNotificationAsync(participantId, messageResponse, conversationId);
                }
            }
        }

        await Clients.Caller.SendAsync("MessageSent", message.Id);
    }

    private async Task SendPushNotificationAsync(string recipientUserId, MessageResponse message, int conversationId)
    {
        try
        {
            var vapidPublicKey = _configuration["Vapid:PublicKey"];
            var vapidPrivateKey = _configuration["Vapid:PrivateKey"];
            
            if (string.IsNullOrEmpty(vapidPublicKey) || string.IsNullOrEmpty(vapidPrivateKey))
            {
                return;
            }

            var subscriptions = await _context.PushSubscriptions
                .Where(s => s.UserId == recipientUserId)
                .ToListAsync();

            if (!subscriptions.Any())
            {
                return;
            }

            var pushClient = new PushClient();
            var vapidDetails = new VapidDetails(
                "mailto:admin@stopsmoke.info",
                vapidPublicKey,
                vapidPrivateKey
            );

            foreach (var subscription in subscriptions)
            {
                try
                {
                    var pushSubscription = new PushSubscription(
                        subscription.Endpoint,
                        subscription.P256DH,
                        subscription.Auth
                    );

                    var payload = new
                    {
                        title = $"💬 {message.SenderName}",
                        body = message.Content.Length > 100 ? message.Content[..100] + "..." : message.Content,
                        icon = "/pwa-512x512.png",
                        conversationId = conversationId,
                        messageId = message.Id
                    };

                    var jsonPayload = System.Text.Json.JsonSerializer.Serialize(payload);

                    await pushClient.SendNotificationAsync(
                        pushSubscription,
                        jsonPayload,
                        vapidDetails
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Push notification failed for subscription: {ex.Message}");
                    // Remove invalid subscription
                    await _context.PushSubscriptions.Where(s => s.Id == subscription.Id).ExecuteDeleteAsync();
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Push notification error: {ex.Message}");
        }
    }

    public async Task JoinConversation(int conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
    }

    public async Task LeaveConversation(int conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
    }

    public async Task MarkAsRead(int conversationId)
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId))
        {
            return;
        }

        var participant = await _context.ConversationParticipants
            .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == userId);

        if (participant != null)
        {
            participant.LastReadAt = DateTime.UtcNow;
            
            // Mark all unread messages from other participants as read
            var messagesToMarkAsRead = await _context.Messages
                .Where(m => m.ConversationId == conversationId 
                       && m.SenderId != userId 
                       && !m.IsRead)
                .ToListAsync();

            foreach (var message in messagesToMarkAsRead)
            {
                message.IsRead = true;
            }

            await _context.SaveChangesAsync();

            // Notify the sender(s) that their messages were read
            var conversation = await _context.Conversations
                .Include(c => c.Participants)
                .FirstOrDefaultAsync(c => c.Id == conversationId);

            if (conversation != null)
            {
                foreach (var otherParticipant in conversation.Participants.Where(p => p.UserId != userId))
                {
                    // Send message status update to the other participant
                    await Clients.User(otherParticipant.UserId)
                        .SendAsync("MessagesRead", conversationId, messagesToMarkAsRead.Select(m => m.Id).ToList());
                }
            }
        }
    }

    public Task<List<string>> GetOnlineUsers()
    {
        return Task.FromResult(_onlineUsers.Keys.ToList());
    }

    public static bool IsUserOnline(string userId)
    {
        return _onlineUsers.ContainsKey(userId);
    }

    public static int GetOnlineUsersCount()
    {
        return _onlineUsers.Count;
    }

    public async Task EditMessage(int messageId, string newContent)
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId))
        {
            throw new HubException("User not authenticated");
        }

        var message = await _context.Messages
            .Include(m => m.Conversation)
            .Include(m => m.Sender)
            .Include(m => m.ReplyTo)
                .ThenInclude(r => r != null ? r.Sender : null)
            .FirstOrDefaultAsync(m => m.Id == messageId);

        if (message == null)
        {
            throw new HubException("Message not found");
        }

        if (message.SenderId != userId)
        {
            throw new HubException("You can only edit your own messages");
        }

        if (message.IsDeleted)
        {
            throw new HubException("Cannot edit a deleted message");
        }

        // Security check: Prevent editing system/meta messages (e.g. sharing duration)
        if (message.Content.StartsWith("[APP_META:QUIT_SHARE]"))
        {
            throw new HubException("System-generated messages cannot be edited");
        }

        message.Content = newContent;
        message.IsEdited = true;
        message.EditedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var messageResponse = new MessageResponse
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = message.SenderId,
            SenderName = message.Sender.Name ?? message.Sender.Email ?? "Unknown",
            SenderAvatarUrl = message.Sender.AvatarUrl,
            SenderAvatarThumbnailUrl = message.Sender.AvatarThumbnailUrl,
            Content = message.Content,
            SentAt = message.SentAt,
            IsRead = message.IsRead,
            IsEdited = message.IsEdited,
            EditedAt = message.EditedAt,
            IsDeleted = message.IsDeleted,
            ReplyToId = message.ReplyToId,
            ReplyToSenderName = message.ReplyTo?.Sender?.Name ?? message.ReplyTo?.Sender?.Email,
            ReplyToContent = message.ReplyTo?.IsDeleted == true ? null : message.ReplyTo?.Content
        };

        if (message.Conversation.IsGlobal)
        {
            await Clients.All.SendAsync("MessageEdited", messageResponse);
        }
        else
        {
            var participantIds = await _context.ConversationParticipants
                .Where(p => p.ConversationId == message.ConversationId)
                .Select(p => p.UserId)
                .ToListAsync();

            await Clients.Users(participantIds).SendAsync("MessageEdited", messageResponse);
        }
    }

    public async Task<List<PublicProfileDto>> GetOnlineUsersDetails()
    {
        var onlineUserIds = _onlineUsers.Keys.ToList();
        
        var users = await _context.Users
            .Where(u => onlineUserIds.Contains(u.Id))
            .OrderBy(u => u.Name)
            .Take(200)
            .Select(u => new PublicProfileDto
            {
                Id = u.Id,
                Name = u.Name ?? "Unknown",
                Email = u.Email ?? "",
                AvatarUrl = u.AvatarUrl,
                AvatarThumbnailUrl = u.AvatarThumbnailUrl,
                QuitDate = u.QuitDate,
                LastSeen = u.LastSeen
                // We don't need all fields but PublicProfileDto is reusable
            })
            .ToListAsync();

        return users;
    }
}
