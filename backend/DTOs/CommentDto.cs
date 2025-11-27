using System.ComponentModel.DataAnnotations;

namespace StopSmoke.Backend.DTOs;

public class CommentDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int ArticleId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public bool IsAuthor { get; set; }
}

public class CreateCommentDto
{
    [Required(ErrorMessage = "Content is required")]
    [StringLength(1000, MinimumLength = 1, ErrorMessage = "Content must be between 1 and 1000 characters")]
    public string Content { get; set; } = string.Empty;
}
