using System.ComponentModel.DataAnnotations;

namespace StopSmoke.Backend.Models;

public class Marathon
{
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<MarathonParticipant> Participants { get; set; } = new List<MarathonParticipant>();
}
