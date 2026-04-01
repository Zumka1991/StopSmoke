namespace StopSmoke.Backend.DTOs;

public class PublicProfileDto
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public DateTime? QuitDate { get; set; }
    public DateTime? LastSeen { get; set; }
    public int CompletedMarathonsCount { get; set; }
    public string? AvatarUrl { get; set; }
    public string? AvatarThumbnailUrl { get; set; }
}
