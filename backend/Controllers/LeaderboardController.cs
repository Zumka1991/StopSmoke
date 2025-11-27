using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StopSmoke.Backend.Models;

namespace StopSmoke.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaderboardController : ControllerBase
{
    private readonly UserManager<User> _userManager;

    public LeaderboardController(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetLeaderboard()
    {
        var users = await _userManager.Users
            .Where(u => u.QuitDate != null && !string.IsNullOrWhiteSpace(u.Name) && u.ShowInLeaderboard)
            .ToListAsync();

        var currentUserEmail = User.Identity?.Name;

        var leaderboard = users
            .Select(u => new
            {
                u.Name,
                u.Email,
                QuitDate = u.QuitDate!.Value,
                DaysClean = (int)(DateTime.UtcNow - u.QuitDate!.Value).TotalDays
            })
            .OrderByDescending(u => u.DaysClean)
            .Take(50)
            .Select((u, index) => new
            {
                Rank = index + 1,
                u.Name,
                u.Email,
                u.DaysClean,
                IsCurrentUser = u.Email == currentUserEmail
            })
            .ToList();

        return Ok(leaderboard);
    }
}
