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

        var conversations = await _context.ConversationParticipants
            .Where(p => p.UserId == userId)
            .Include(p => p.Conversation)
                .ThenInclude(c => c.Participants)
                .ThenInclude(p => p.User)
            .Include(p => p.Conversation)
                .ThenInclude(c => c.Messages)
            .Select(p => p.Conversation)
            .ToListAsync();

        var result = new List<ConversationListItemResponse>();

        foreach (var conv in conversations)
        {
            var otherParticipant = conv.Participants.FirstOrDefault(p => p.UserId != userId);
            if (otherParticipant == null) continue;

            var lastMessage = conv.Messages.OrderByDescending(m => m.SentAt).FirstOrDefault();
            var userParticipant = conv.Participants.First(p => p.UserId == userId);
            var unreadCount = conv.Messages.Count(m => 
                m.SenderId != userId && 
                (userParticipant.LastReadAt == null || m.SentAt > userParticipant.LastReadAt));

            result.Add(new ConversationListItemResponse
            {
                Id = conv.Id,
                OtherUserName = otherParticipant.User.Name ?? otherParticipant.User.Email ?? "Unknown",
                OtherUserEmail = otherParticipant.User.Email ?? "",
                LastMessage = lastMessage?.Content,
                LastMessageAt = lastMessage?.SentAt,
                UnreadCount = unreadCount,
                IsOtherUserOnline = ChatHub.IsUserOnline(otherParticipant.UserId)
            });
        }

        return Ok(result.OrderByDescending(c => c.LastMessageAt?.Ticks ?? 0).ToList());
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

        var response = new ConversationResponse
        {
            Id = conversation.Id,
            CreatedAt = conversation.CreatedAt,
            LastMessageAt = conversation.LastMessageAt,
            Participants = conversation.Participants.Select(p => new ParticipantResponse
            {
                UserId = p.UserId,
                UserName = p.User.Name ?? p.User.Email ?? "Unknown",
                Email = p.User.Email ?? "",
                JoinedAt = p.JoinedAt
            }).ToList(),
            Messages = conversation.Messages.OrderBy(m => m.SentAt).Select(m => new MessageResponse
            {
                Id = m.Id,
                ConversationId = m.ConversationId,
                SenderId = m.SenderId,
                SenderName = m.Sender.Name ?? m.Sender.Email ?? "Unknown",
                Content = m.Content,
                SentAt = m.SentAt,
                IsRead = m.IsRead
            }).ToList()
        };

        return Ok(response);
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
        var existingConversation = await _context.ConversationParticipants
            .Where(p => p.UserId == userId)
            .Select(p => p.Conversation)
            .Where(c => c.Participants.Any(p => p.UserId == otherUser.Id))
            .FirstOrDefaultAsync();

        if (existingConversation != null)
        {
            return Ok(new { conversationId = existingConversation.Id, message = "Conversation already exists" });
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
}
