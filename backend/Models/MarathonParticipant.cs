using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace StopSmoke.Backend.Models;

public enum MarathonStatus
{
    Active,
    Disqualified,
    Completed
}

public class MarathonParticipant
{
    public int Id { get; set; }

    [Required]
    public int MarathonId { get; set; }
    [JsonIgnore]
    public Marathon? Marathon { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    [JsonIgnore]
    public User? User { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public MarathonStatus Status { get; set; } = MarathonStatus.Active;
}
