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
    private readonly string _userId;

    public PushNotificationsController(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _userId = httpContextAccessor.HttpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                  ?? throw new UnauthorizedAccessException();
    }

    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] PushSubscriptionRequest request)
    {
        if (string.IsNullOrEmpty(request.Endpoint) || string.IsNullOrEmpty(request.P256DH) || string.IsNullOrEmpty(request.Auth))
        {
            return BadRequest("Invalid subscription data");
        }

        // Check if subscription already exists
        var existing = await _context.PushSubscriptions
            .FirstOrDefaultAsync(s => s.Endpoint == request.Endpoint && s.UserId == _userId);

        if (existing == null)
        {
            var subscription = new PushSubscription
            {
                UserId = _userId,
                Endpoint = request.Endpoint,
                P256DH = request.P256DH,
                Auth = request.Auth
            };

            _context.PushSubscriptions.Add(subscription);
            await _context.SaveChangesAsync();
        }

        return Ok();
    }

    [HttpDelete("unsubscribe")]
    public async Task<IActionResult> Unsubscribe([FromBody] UnsubscribeRequest request)
    {
        var subscriptions = await _context.PushSubscriptions
            .Where(s => s.UserId == _userId && s.Endpoint == request.Endpoint)
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
