using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using StopSmoke.Backend.Data;
using StopSmoke.Backend.DTOs;
using System.Collections.Concurrent;

namespace StopSmoke.Backend.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly ApplicationDbContext _context;
    // Store multiple connection IDs per user
    private static readonly ConcurrentDictionary<string, HashSet<string>> _onlineUsers = new();

    public ChatHub(ApplicationDbContext context)
    {
        _context = context;
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

    public async Task SendMessage(int conversationId, string content)
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

        // Create message
        var message = new Models.Message
        {
            ConversationId = conversationId,
            SenderId = userId,
            Content = content,
            SentAt = DateTime.UtcNow,
            IsRead = false
        };

        _context.Messages.Add(message);

        // Update conversation last message time
        var conversation = await _context.Conversations.FindAsync(conversationId);
        if (conversation != null)
        {
            conversation.LastMessageAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Load sender info
        var sender = await _context.Users.FindAsync(userId);

        var messageResponse = new MessageResponse
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = message.SenderId,
            SenderName = sender?.Name ?? sender?.Email ?? "Unknown",
            Content = message.Content,
            SentAt = message.SentAt,
            IsRead = message.IsRead
        };

        // Send to all participants
        var participantIds = await _context.ConversationParticipants
            .Where(p => p.ConversationId == conversationId)
            .Select(p => p.UserId)
            .ToListAsync();

        await Clients.Users(participantIds).SendAsync("ReceiveMessage", messageResponse);
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
            await _context.SaveChangesAsync();
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
}
