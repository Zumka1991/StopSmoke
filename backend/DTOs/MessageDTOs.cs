namespace StopSmoke.Backend.DTOs;

// Request DTOs
public class SendMessageRequest
{
    public int ConversationId { get; set; }
    public string Content { get; set; } = null!;
}

public class CreateConversationRequest
{
    public string ParticipantEmail { get; set; } = null!;
}

// Response DTOs
public class MessageResponse
{
    public int Id { get; set; }
    public int ConversationId { get; set; }
    public string SenderId { get; set; } = null!;
    public string SenderName { get; set; } = null!;
    public string Content { get; set; } = null!;
    public DateTime SentAt { get; set; }
    public bool IsRead { get; set; }
    public bool IsDeleted { get; set; }
}

public class ConversationResponse
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public List<ParticipantResponse> Participants { get; set; } = new();
    public List<MessageResponse> Messages { get; set; } = new();
    public bool IsBlocked { get; set; }
    public bool IsBlockedByOther { get; set; }
    public bool IsGlobal { get; set; }
}

public class ConversationListItemResponse
{
    public int Id { get; set; }
    public string OtherUserId { get; set; } = null!;
    public string OtherUserName { get; set; } = null!;
    public string OtherUserEmail { get; set; } = null!;
    public string? LastMessage { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public int UnreadCount { get; set; }
    public bool IsOtherUserOnline { get; set; }
    public DateTime? OtherUserLastSeen { get; set; }
    public bool IsBlocked { get; set; }
    public bool IsGlobal { get; set; }
    public int OnlineCount { get; set; }  // For global chat - number of online users
}

public class ParticipantResponse
{
    public string UserId { get; set; } = null!;
    public string UserName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public DateTime JoinedAt { get; set; }
}

public class UserSearchResponse
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
}
