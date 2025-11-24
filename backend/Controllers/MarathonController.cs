using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StopSmoke.Backend.Data;
using StopSmoke.Backend.DTOs;
using StopSmoke.Backend.Models;
using StopSmoke.Backend.Services;
using System.Security.Claims;

namespace StopSmoke.Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MarathonController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly MarathonCompletionService _completionService;

    public MarathonController(
        ApplicationDbContext context, 
        UserManager<User> userManager,
        MarathonCompletionService completionService)
    {
        _context = context;
        _userManager = userManager;
        _completionService = completionService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MarathonDto>>> GetMarathons()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        var marathons = await _context.Marathons
            .Include(m => m.Participants)
            .Where(m => m.IsActive && m.EndDate > DateTime.UtcNow)
            .OrderBy(m => m.StartDate)
            .ToListAsync();

        var dtos = marathons.Select(m => {
            var participant = m.Participants.FirstOrDefault(p => p.UserId == userId);
            return new MarathonDto
            {
                Id = m.Id,
                Title = m.Title,
                Description = m.Description,
                StartDate = m.StartDate,
                EndDate = m.EndDate,
                ParticipantsCount = m.Participants.Count,
                IsJoined = participant != null,
                UserStatus = participant?.Status.ToString()
            };
        }).ToList();

        return Ok(dtos);
    }

    [HttpPost]
    public async Task<ActionResult<Marathon>> CreateMarathon(CreateMarathonDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId);

        if (user == null || !user.IsAdmin)
        {
            return Forbid();
        }

        var marathon = new Marathon
        {
            Title = dto.Title,
            Description = dto.Description,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate
        };

        _context.Marathons.Add(marathon);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMarathons), new { id = marathon.Id }, marathon);
    }

    [HttpPost("{id}/join")]
    public async Task<IActionResult> JoinMarathon(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var marathon = await _context.Marathons.FindAsync(id);

        if (marathon == null)
        {
            return NotFound();
        }

        if (marathon.StartDate <= DateTime.UtcNow)
        {
            return BadRequest("Marathon has already started");
        }

        var existingParticipant = await _context.MarathonParticipants
            .FirstOrDefaultAsync(p => p.MarathonId == id && p.UserId == userId);

        if (existingParticipant != null)
        {
            return BadRequest("Already joined");
        }

        var participant = new MarathonParticipant
        {
            MarathonId = id,
            UserId = userId,
            Status = MarathonStatus.Active
        };

        _context.MarathonParticipants.Add(participant);
        await _context.SaveChangesAsync();

        return Ok();
    }

    [HttpPost("complete-ended")]
    public async Task<IActionResult> CompleteEndedMarathons()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId);

        if (user == null || !user.IsAdmin)
        {
            return Forbid();
        }

        await _completionService.CompleteEndedMarathonsAsync();

        return Ok(new { Message = "Ended marathons completed successfully" });
    }
}
