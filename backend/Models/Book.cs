using System;
using System.ComponentModel.DataAnnotations;

namespace StopSmoke.Backend.Models;

public class Book
{
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = null!;

    [Required]
    [StringLength(200)]
    public string Author { get; set; } = null!;

    [Required]
    [StringLength(2000)]
    public string Description { get; set; } = null!;

    [StringLength(500)]
    public string? CoverImageUrl { get; set; }

    [StringLength(500)]
    public string? Fb2FragmentUrl { get; set; }

    [StringLength(500)]
    public string? ExternalUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
