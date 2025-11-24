using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace StopSmoke.Backend.Models;

public class User : IdentityUser
{
    [StringLength(100, MinimumLength = 3)]
    public string? Name { get; set; }

    public DateTime? QuitDate { get; set; }
    public int CigarettesPerDay { get; set; }
    public decimal PricePerPack { get; set; }
    public string Currency { get; set; } = "USD";
    public bool IsAdmin { get; set; } = false;
}
