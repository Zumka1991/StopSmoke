using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StopSmoke.Backend.Data;
using StopSmoke.Backend.Models;

namespace StopSmoke.Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RelapseController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public RelapseController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Relapse>>> GetRelapses()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        return await _context.Relapses
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.Date)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Relapse>> AddRelapse([FromBody] RelapseDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        // Find the user and reset their quit date
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.QuitDate = null;
        }

        var relapse = new Relapse
        {
            UserId = userId,
            Date = DateTime.UtcNow,
            Reason = dto.Reason
        };

        _context.Relapses.Add(relapse);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetRelapses), new { id = relapse.Id }, relapse);
    }
}

public class RelapseDto
{
    public string? Reason { get; set; }
}
