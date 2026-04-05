using System.ComponentModel.DataAnnotations;

namespace StopSmoke.Backend.Models;

public class PushSubscription
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    public string Endpoint { get; set; } = string.Empty;
    
    [Required]
    public string P256DH { get; set; } = string.Empty;
    
    [Required]
    public string Auth { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation
    public User? User { get; set; }
}
