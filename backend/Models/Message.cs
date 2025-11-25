using System.ComponentModel.DataAnnotations;

namespace StopSmoke.Backend.Models;

public class Message
{
    [Key]
    public int Id { get; set; }

    public int ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;

    public string SenderId { get; set; } = null!;
    public User Sender { get; set; } = null!;

    [Required]
    [StringLength(2000)]
    public string Content { get; set; } = null!;

    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    public bool IsRead { get; set; } = false;
}
