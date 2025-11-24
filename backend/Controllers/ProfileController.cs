using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using StopSmoke.Backend.DTOs;
using StopSmoke.Backend.Models;

namespace StopSmoke.Backend.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class ProfileController : ControllerBase
{
    private readonly UserManager<User> _userManager;

    public ProfileController(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFound();

        var profile = new UserProfileDto
        {
            Email = user.Email!,
            Name = user.Name,
            QuitDate = user.QuitDate,
            CigarettesPerDay = user.CigarettesPerDay,
            PricePerPack = user.PricePerPack,
            Currency = user.Currency,
            IsAdmin = user.IsAdmin
        };

        return Ok(profile);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto model)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFound();

        if (!string.IsNullOrWhiteSpace(model.Name))
        {
            user.Name = model.Name;
        }
        user.QuitDate = model.QuitDate;
        user.CigarettesPerDay = model.CigarettesPerDay;
        user.PricePerPack = model.PricePerPack;
        user.Currency = model.Currency;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok(new { Message = "Profile updated successfully" });
    }
}
