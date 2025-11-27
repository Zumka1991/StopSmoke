using System.ComponentModel.DataAnnotations;

namespace StopSmoke.Backend.Models;

public class Comment
{
    public int Id { get; set; }

    [Required]
    [StringLength(1000)]
    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Article relation
    public int ArticleId { get; set; }
    public Article Article { get; set; } = null!;

    // User relation
    [Required]
    public string UserId { get; set; } = string.Empty;
    public User User { get; set; } = null!;
}
