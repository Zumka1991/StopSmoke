using System.ComponentModel.DataAnnotations;

namespace StopSmoke.Backend.Models;

public class Article
{
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Summary { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public bool IsPublished { get; set; } = false;

    // Author info
    public string? AuthorId { get; set; }
    public User? Author { get; set; }
}
