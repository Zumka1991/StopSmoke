using System.ComponentModel.DataAnnotations;

namespace StopSmoke.Backend.Models;

public class ConversationParticipant
{
    [Key]
    public int Id { get; set; }

    public int ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;

    public string UserId { get; set; } = null!;
    public User User { get; set; } = null!;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastReadAt { get; set; }
}
