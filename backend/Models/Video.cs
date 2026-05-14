using System;
using System.ComponentModel.DataAnnotations;

namespace StopSmoke.Backend.Models;

public class Video
{
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = null!;

    [Required]
    [StringLength(2000)]
    public string Description { get; set; } = null!;

    [Required]
    [StringLength(500)]
    public string VideoUrl { get; set; } = null!;

    [Required]
    [StringLength(50)]
    public string Platform { get; set; } = null!; // YouTube, RuTube, Other

    [StringLength(500)]
    public string? ThumbnailUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
