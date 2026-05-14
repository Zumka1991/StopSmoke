using System.ComponentModel.DataAnnotations;

namespace StopSmoke.Backend.DTOs;

public class VideoResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string VideoUrl { get; set; } = null!;
    public string Platform { get; set; } = null!;
    public string? ThumbnailUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateVideoRequest
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = null!;

    [Required]
    [StringLength(2000)]
    public string Description { get; set; } = null!;

    [Required]
    [StringLength(500)]
    public string VideoUrl { get; set; } = null!;

    [StringLength(500)]
    public string? ThumbnailUrl { get; set; }
}

public class UpdateVideoRequest
{
    [StringLength(200)]
    public string? Title { get; set; }

    [StringLength(2000)]
    public string? Description { get; set; }

    [StringLength(500)]
    public string? VideoUrl { get; set; }

    [StringLength(500)]
    public string? ThumbnailUrl { get; set; }
}
