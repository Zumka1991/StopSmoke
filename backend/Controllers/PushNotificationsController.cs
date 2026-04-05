using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StopSmoke.Backend.Data;
using StopSmoke.Backend.Models;

namespace StopSmoke.Backend.Controllers;

[ApiController]
[Route("api/push")]
[Authorize]
public class PushNotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PushNotificationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    private string GetUserId()
    {
        return User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
               ?? throw new UnauthorizedAccessException("User ID not found");
    }

    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] PushSubscriptionRequest request)
    {
        var userId = GetUserId();
        Console.WriteLine($"[PUSH] Subscribe request for user: {userId}");

        if (string.IsNullOrEmpty(request.Endpoint) || string.IsNullOrEmpty(request.P256DH) || string.IsNullOrEmpty(request.Auth))
        {
            Console.WriteLine("[PUSH] Invalid data");
            return BadRequest("Invalid subscription data");
        }

        try
        {
            var existing = await _context.PushSubscriptions
                .FirstOrDefaultAsync(s => s.Endpoint == request.Endpoint && s.UserId == userId);

            if (existing == null)
            {
                var subscription = new PushSubscription
                {
                    UserId = userId,
                    Endpoint = request.Endpoint,
                    P256DH = request.P256DH,
                    Auth = request.Auth,
                    IsPushMuted = false
                };

                _context.PushSubscriptions.Add(subscription);
                await _context.SaveChangesAsync();
                Console.WriteLine($"[PUSH] Subscription saved for user {userId}");
            }
            else
            {
                Console.WriteLine($"[PUSH] Subscription already exists for user {userId}");
            }

            return Ok();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[PUSH] Error: {ex.Message}");
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var userId = GetUserId();
        var subs = await _context.PushSubscriptions.Where(s => s.UserId == userId).ToListAsync();
        bool hasSub = subs.Any();
        // User is considered muted if they have subscriptions AND all of them are muted
        bool isMuted = hasSub && subs.All(s => s.IsPushMuted);
        return Ok(new { IsSubscribed = hasSub, IsMuted = isMuted });
    }

    [HttpPost("toggle-mute")]
    public async Task<IActionResult> ToggleMute()
    {
        var userId = GetUserId();
        var subs = await _context.PushSubscriptions.Where(s => s.UserId == userId).ToListAsync();

        if (!subs.Any())
        {
            return Ok(new { IsMuted = false });
        }

        // Toggle state: if any is unmuted, mute all. If all are muted, unmute all.
        bool currentlyMuted = subs.Any(s => s.IsPushMuted); // If any is muted, we consider state as "muting in progress" or partially muted.
        // Better logic: If ALL are muted, unmute. If ANY is unmuted, mute all.
        bool allMuted = subs.All(s => s.IsPushMuted);
        bool newState = !allMuted;

        foreach (var sub in subs)
        {
            sub.IsPushMuted = newState;
        }
        await _context.SaveChangesAsync();

        Console.WriteLine($"[PUSH] Toggled mute for user {userId} to {newState}");
        return Ok(new { IsMuted = newState });
    }

    [HttpDelete("unsubscribe")]
    public async Task<IActionResult> Unsubscribe([FromBody] UnsubscribeRequest request)
    {
        var userId = GetUserId();
        var subscriptions = await _context.PushSubscriptions
            .Where(s => s.UserId == userId && s.Endpoint == request.Endpoint)
            .ToListAsync();

        if (subscriptions.Any())
        {
            _context.PushSubscriptions.RemoveRange(subscriptions);
            await _context.SaveChangesAsync();
        }

        return Ok();
    }
}

public record PushSubscriptionRequest(string Endpoint, string P256DH, string Auth);
public record UnsubscribeRequest(string Endpoint);
