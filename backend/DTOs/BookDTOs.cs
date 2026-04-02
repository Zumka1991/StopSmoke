using System.ComponentModel.DataAnnotations;

namespace StopSmoke.Backend.DTOs;

public class BookResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string Author { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string? CoverImageUrl { get; set; }
    public string? Fb2FragmentUrl { get; set; }
    public string? ExternalUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateBookRequest
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = null!;

    [Required]
    [StringLength(200)]
    public string Author { get; set; } = null!;

    [Required]
    [StringLength(2000)]
    public string Description { get; set; } = null!;

    public string? ExternalUrl { get; set; }
}

public class UpdateBookRequest
{
    [StringLength(200)]
    public string? Title { get; set; }

    [StringLength(200)]
    public string? Author { get; set; }

    [StringLength(2000)]
    public string? Description { get; set; }

    public string? ExternalUrl { get; set; }
}
