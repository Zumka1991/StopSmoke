using System.ComponentModel.DataAnnotations;

namespace StopSmoke.Backend.Models;

public class Conversation
{
    [Key]
    public int Id { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastMessageAt { get; set; }

    // Global chat flag - only one global conversation should exist
    public bool IsGlobal { get; set; } = false;

    // Navigation properties
    public ICollection<ConversationParticipant> Participants { get; set; } = new List<ConversationParticipant>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
