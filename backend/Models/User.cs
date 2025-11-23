using Microsoft.AspNetCore.Identity;
using System;

namespace StopSmoke.Backend.Models;

public class User : IdentityUser
{
    public DateTime? QuitDate { get; set; }
    public int CigarettesPerDay { get; set; }
    public decimal PricePerPack { get; set; }
    public string Currency { get; set; } = "USD";
}
