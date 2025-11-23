namespace StopSmoke.Backend.DTOs;

public class UserProfileDto
{
    public string Email { get; set; } = string.Empty;
    public DateTime? QuitDate { get; set; }
    public int CigarettesPerDay { get; set; }
    public decimal PricePerPack { get; set; }
    public string Currency { get; set; } = "USD";
}

public class UpdateProfileDto
{
    public DateTime? QuitDate { get; set; }
    public int CigarettesPerDay { get; set; }
    public decimal PricePerPack { get; set; }
    public string Currency { get; set; } = "USD";
}
