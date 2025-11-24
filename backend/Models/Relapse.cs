using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace StopSmoke.Backend.Models;

public class Relapse
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    [JsonIgnore]
    public User? User { get; set; }

    public DateTime Date { get; set; }

    [StringLength(500)]
    public string? Reason { get; set; }
}
