using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StopSmoke.Backend.Data;
using StopSmoke.Backend.DTOs;
using StopSmoke.Backend.Hubs;
using StopSmoke.Backend.Models;

namespace StopSmoke.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;

    public MessagesController(ApplicationDbContext context, UserManager<User> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    // GET: api/messages/conversations
    [HttpGet("conversations")]
    public async Task<ActionResult<List<ConversationListItemResponse>>> GetConversations()
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        // Ensure user is a participant of the global chat
        await EnsureGlobalChatParticipant(userId);

        var userParticipants = await _context.ConversationParticipants
            .Where(p => p.UserId == userId && !p.IsDeleted)
            .Include(p => p.Conversation)
                .ThenInclude(c => c.Participants)
                .ThenInclude(p => p.User)
            .Include(p => p.Conversation)
                .ThenInclude(c => c.Messages)
            .ToListAsync();

        var result = new List<ConversationListItemResponse>();

        foreach (var userParticipant in userParticipants)
        {
            var conv = userParticipant.Conversation;

            // Filter messages based on ClearedHistoryAt
            var visibleMessages = conv.Messages
                .Where(m => userParticipant.ClearedHistoryAt == null || m.SentAt > userParticipant.ClearedHistoryAt)
                .ToList();

            var lastMessage = visibleMessages.OrderByDescending(m => m.SentAt).FirstOrDefault();

            var unreadCount = visibleMessages.Count(m =>
                m.SenderId != userId &&
                (userParticipant.LastReadAt == null || m.SentAt > userParticipant.LastReadAt));

            if (conv.IsGlobal)
            {
                // Global chat - special handling
                result.Add(new ConversationListItemResponse
                {
                    Id = conv.Id,
                    OtherUserId = "global",
                    OtherUserName = "Global Chat",
                    OtherUserEmail = "",
                    LastMessage = lastMessage?.Content,
                    LastMessageAt = lastMessage?.SentAt,
                    UnreadCount = unreadCount,
                    IsOtherUserOnline = true,
                    OtherUserLastSeen = null,
                    IsBlocked = false,
                    IsGlobal = true,
                    OnlineCount = ChatHub.GetOnlineUsersCount()
                });
            }
            else
            {
                // Regular private chat
                var otherParticipant = conv.Participants.FirstOrDefault(p => p.UserId != userId);
                if (otherParticipant == null) continue;

                result.Add(new ConversationListItemResponse
                {
                    Id = conv.Id,
                    OtherUserId = otherParticipant.UserId,
                    OtherUserName = otherParticipant.User.Name ?? otherParticipant.User.Email ?? "Unknown",
                    OtherUserEmail = otherParticipant.User.Email ?? "",
                    LastMessage = lastMessage?.Content,
                    LastMessageAt = lastMessage?.SentAt,
                    UnreadCount = unreadCount,
                    IsOtherUserOnline = ChatHub.IsUserOnline(otherParticipant.UserId),
                    OtherUserLastSeen = otherParticipant.User.LastSeen,
                    IsBlocked = userParticipant.IsBlocked,
                    IsGlobal = false,
                    OnlineCount = 0
                });
            }
        }

        // Sort: Global chat first, then by last message time
        return Ok(result
            .OrderByDescending(c => c.IsGlobal)
            .ThenByDescending(c => c.LastMessageAt?.Ticks ?? 0)
            .ToList());
    }

    // Helper method to ensure global chat exists and user is a participant
    private async Task EnsureGlobalChatParticipant(string userId)
    {
        // Find or create global conversation
        var globalConversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.IsGlobal);

        if (globalConversation == null)
        {
            // Create global conversation
            globalConversation = new Conversation
            {
                CreatedAt = DateTime.UtcNow,
                IsGlobal = true
            };
            _context.Conversations.Add(globalConversation);
            await _context.SaveChangesAsync();
        }

        // Check if user is already a participant
        var existingParticipant = await _context.ConversationParticipants
            .FirstOrDefaultAsync(p => p.ConversationId == globalConversation.Id && p.UserId == userId);

        if (existingParticipant == null)
        {
            // Add user as participant
            _context.ConversationParticipants.Add(new ConversationParticipant
            {
                ConversationId = globalConversation.Id,
                UserId = userId,
                JoinedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }
        else if (existingParticipant.IsDeleted)
        {
            // Restore participation if it was deleted
            existingParticipant.IsDeleted = false;
            await _context.SaveChangesAsync();
        }
    }

    // GET: api/messages/conversations/{id}
    [HttpGet("conversations/{id}")]
    public async Task<ActionResult<ConversationResponse>> GetConversation(int id)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var conversation = await _context.Conversations
            .Include(c => c.Participants)
                .ThenInclude(p => p.User)
            .Include(c => c.Messages)
                .ThenInclude(m => m.Sender)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (conversation == null)
        {
            return NotFound();
        }

        // Check if user is participant
        if (!conversation.Participants.Any(p => p.UserId == userId))
        {
            return Forbid();
        }

        var userParticipant = conversation.Participants.First(p => p.UserId == userId);

        // For global chat, there's no "other" participant concept
        var otherParticipant = conversation.IsGlobal
            ? null
            : conversation.Participants.FirstOrDefault(p => p.UserId != userId);

        var response = new ConversationResponse
        {
            Id = conversation.Id,
            CreatedAt = conversation.CreatedAt,
            LastMessageAt = conversation.LastMessageAt,
            IsBlocked = userParticipant.IsBlocked,
            IsBlockedByOther = otherParticipant?.IsBlocked ?? false,
            IsGlobal = conversation.IsGlobal,
            Participants = conversation.Participants.Select(p => new ParticipantResponse
            {
                UserId = p.UserId,
                UserName = p.User.Name ?? p.User.Email ?? "Unknown",
                Email = p.User.Email ?? "",
                JoinedAt = p.JoinedAt
            }).ToList(),
            // Load only last 50 messages by default, respecting ClearedHistoryAt
            Messages = conversation.Messages
                .Where(m => userParticipant.ClearedHistoryAt == null || m.SentAt > userParticipant.ClearedHistoryAt)
                .OrderByDescending(m => m.SentAt)
                .Take(50)
                .OrderBy(m => m.SentAt)
                .Select(m => new MessageResponse
                {
                    Id = m.Id,
                    ConversationId = m.ConversationId,
                    SenderId = m.SenderId,
                    SenderName = m.Sender.Name ?? m.Sender.Email ?? "Unknown",
                    Content = m.Content,
                    SentAt = m.SentAt,
                    IsRead = m.IsRead,
                    IsDeleted = m.IsDeleted
                }).ToList()
        };

        return Ok(response);
    }

    // GET: api/messages/conversations/{id}/messages?beforeMessageId={messageId}&count={count}
    [HttpGet("conversations/{id}/messages")]
    public async Task<ActionResult<List<MessageResponse>>> GetOlderMessages(
        int id, 
        [FromQuery] int? beforeMessageId = null, 
        [FromQuery] int count = 50)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        // Get participant to check ClearedHistoryAt
        var participant = await _context.ConversationParticipants
            .FirstOrDefaultAsync(p => p.ConversationId == id && p.UserId == userId);

        if (participant == null)
        {
            return Forbid();
        }

        var query = _context.Messages
            .Include(m => m.Sender)
            .Where(m => m.ConversationId == id);

        // Filter by ClearedHistoryAt
        if (participant.ClearedHistoryAt != null)
        {
            query = query.Where(m => m.SentAt > participant.ClearedHistoryAt);
        }

        // If beforeMessageId is provided, get messages before that message
        if (beforeMessageId.HasValue)
        {
            var beforeMessage = await _context.Messages.FindAsync(beforeMessageId.Value);
            if (beforeMessage != null)
            {
                query = query.Where(m => m.SentAt < beforeMessage.SentAt);
            }
        }

        var messages = await query
            .OrderByDescending(m => m.SentAt)
            .Take(count)
            .OrderBy(m => m.SentAt)
            .Select(m => new MessageResponse
            {
                Id = m.Id,
                ConversationId = m.ConversationId,
                SenderId = m.SenderId,
                SenderName = m.Sender.Name ?? m.Sender.Email ?? "Unknown",
                Content = m.Content,
                SentAt = m.SentAt,
                IsRead = m.IsRead,
                IsDeleted = m.IsDeleted
            })
            .ToListAsync();

        return Ok(messages);
    }

    // POST: api/messages/conversations
    [HttpPost("conversations")]
    public async Task<ActionResult<ConversationResponse>> CreateConversation([FromBody] CreateConversationRequest request)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        // Find other user by email
        var otherUser = await _userManager.FindByEmailAsync(request.ParticipantEmail);
        if (otherUser == null)
        {
            return NotFound(new { message = "User not found" });
        }

        if (otherUser.Id == userId)
        {
            return BadRequest(new { message = "Cannot create conversation with yourself" });
        }

        // Check if conversation already exists
        var existingParticipant = await _context.ConversationParticipants
            .Where(p => p.UserId == userId)
            .Include(p => p.Conversation)
                .ThenInclude(c => c.Participants)
            .FirstOrDefaultAsync(p => p.Conversation.Participants.Any(cp => cp.UserId == otherUser.Id));

        if (existingParticipant != null)
        {
            // If it was deleted, restore it
            if (existingParticipant.IsDeleted)
            {
                existingParticipant.IsDeleted = false;
                await _context.SaveChangesAsync();
            }
            
            return Ok(new { conversationId = existingParticipant.ConversationId, message = "Conversation already exists" });
        }

        // Create new conversation
        var conversation = new Conversation
        {
            CreatedAt = DateTime.UtcNow
        };

        _context.Conversations.Add(conversation);
        await _context.SaveChangesAsync();

        // Add participants
        _context.ConversationParticipants.Add(new ConversationParticipant
        {
            ConversationId = conversation.Id,
            UserId = userId,
            JoinedAt = DateTime.UtcNow
        });

        _context.ConversationParticipants.Add(new ConversationParticipant
        {
            ConversationId = conversation.Id,
            UserId = otherUser.Id,
            JoinedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new { conversationId = conversation.Id });
    }

    // PUT: api/messages/conversations/{id}/read
    [HttpPut("conversations/{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var participant = await _context.ConversationParticipants
            .FirstOrDefaultAsync(p => p.ConversationId == id && p.UserId == userId);

        if (participant == null)
        {
            return NotFound();
        }

        participant.LastReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // GET: api/messages/search-users
    [HttpGet("search-users")]
    public async Task<ActionResult<List<UserSearchResponse>>> SearchUsers([FromQuery] string query)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(new { message = "Search query is required" });
        }

        var searchTerm = query.ToLower();
        
        var users = await _context.Users
            .Where(u => 
                u.Id != userId && // Exclude current user
                (
                    (u.Email != null && u.Email.ToLower().Contains(searchTerm)) ||
                    (u.Name != null && u.Name.ToLower().Contains(searchTerm))
                )
            )
            .Take(10)
            .Select(u => new UserSearchResponse
            {
                Id = u.Id,
                Name = u.Name ?? u.Email ?? "Unknown",
                Email = u.Email ?? ""
            })
            .ToListAsync();

        return Ok(users);
    }

    // POST: api/messages/conversations/{id}/block
    [HttpPost("conversations/{id}/block")]
    public async Task<IActionResult> BlockUser(int id)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null) return Unauthorized();

        var participant = await _context.ConversationParticipants
            .FirstOrDefaultAsync(p => p.ConversationId == id && p.UserId == userId);

        if (participant == null) return NotFound();

        participant.IsBlocked = true;
        await _context.SaveChangesAsync();

        return Ok(new { message = "User blocked" });
    }

    // POST: api/messages/conversations/{id}/unblock
    [HttpPost("conversations/{id}/unblock")]
    public async Task<IActionResult> UnblockUser(int id)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null) return Unauthorized();

        var participant = await _context.ConversationParticipants
            .FirstOrDefaultAsync(p => p.ConversationId == id && p.UserId == userId);

        if (participant == null) return NotFound();

        participant.IsBlocked = false;
        await _context.SaveChangesAsync();

        return Ok(new { message = "User unblocked" });
    }

    // DELETE: api/messages/conversations/{id}/messages
    [HttpDelete("conversations/{id}/messages")]
    public async Task<IActionResult> ClearHistory(int id)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null) return Unauthorized();

        var participant = await _context.ConversationParticipants
            .FirstOrDefaultAsync(p => p.ConversationId == id && p.UserId == userId);

        if (participant == null) return NotFound();

        participant.ClearedHistoryAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "History cleared" });
    }

    // DELETE: api/messages/conversations/{id}
    [HttpDelete("conversations/{id}")]
    public async Task<IActionResult> DeleteConversation(int id)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null) return Unauthorized();

        var participant = await _context.ConversationParticipants
            .FirstOrDefaultAsync(p => p.ConversationId == id && p.UserId == userId);

        if (participant == null) return NotFound();

        participant.IsDeleted = true;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Conversation deleted" });
    }

    // DELETE: api/messages/{messageId}
    [HttpDelete("{messageId}")]
    public async Task<IActionResult> DeleteMessage(int messageId)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null) return Unauthorized();

        var message = await _context.Messages
            .Include(m => m.Conversation)
                .ThenInclude(c => c.Participants)
            .FirstOrDefaultAsync(m => m.Id == messageId);

        if (message == null) return NotFound();

        // Check if user is the sender of the message
        if (message.SenderId != userId)
        {
            return Forbid();
        }

        // Check if message is already deleted
        if (message.IsDeleted)
        {
            return BadRequest(new { message = "Message is already deleted" });
        }

        // Mark message as deleted
        message.IsDeleted = true;
        message.Content = ""; // Clear content for privacy
        await _context.SaveChangesAsync();

        return Ok(new { message = "Message deleted" });
    }
}
