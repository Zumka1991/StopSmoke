namespace StopSmoke.Backend.DTOs;

public class MarathonDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int ParticipantsCount { get; set; }
    public bool IsJoined { get; set; }
    public string? UserStatus { get; set; } // Active, Disqualified, Completed
}

public class MarathonParticipantDto
{
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
    public int DaysSinceLapse { get; set; }
}
