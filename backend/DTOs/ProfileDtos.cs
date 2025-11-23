using System.ComponentModel.DataAnnotations;

namespace StopSmoke.Backend.DTOs;

public class UserProfileDto
{
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public DateTime? QuitDate { get; set; }
    public int CigarettesPerDay { get; set; }
    public decimal PricePerPack { get; set; }
    public string Currency { get; set; } = "USD";
}

public class UpdateProfileDto
{
    [StringLength(100, MinimumLength = 3)]
    public string? Name { get; set; }
    
    public DateTime? QuitDate { get; set; }
    public int CigarettesPerDay { get; set; }
    public decimal PricePerPack { get; set; }
    public string Currency { get; set; } = "USD";
}
