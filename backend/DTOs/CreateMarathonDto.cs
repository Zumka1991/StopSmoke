using System.ComponentModel.DataAnnotations;

namespace StopSmoke.Backend.DTOs;

public class CreateMarathonDto
{
    [Required]
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    [Required]
    public DateTime StartDate { get; set; }
    [Required]
    public DateTime EndDate { get; set; }
}
