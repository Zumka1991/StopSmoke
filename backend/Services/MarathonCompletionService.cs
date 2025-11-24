using Microsoft.EntityFrameworkCore;
using StopSmoke.Backend.Data;
using StopSmoke.Backend.Models;

namespace StopSmoke.Backend.Services;

public class MarathonCompletionService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MarathonCompletionService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1);

    public MarathonCompletionService(
        IServiceProvider serviceProvider,
        ILogger<MarathonCompletionService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Marathon Completion Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CompleteEndedMarathonsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error completing marathons");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }
    }

    public async Task CompleteEndedMarathonsAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var now = DateTime.UtcNow;

        // Find active marathons that have ended
        var endedMarathons = await context.Marathons
            .Include(m => m.Participants)
            .Where(m => m.IsActive && m.EndDate < now)
            .ToListAsync();

        if (endedMarathons.Count == 0)
        {
            _logger.LogInformation("No ended marathons to complete");
            return;
        }

        _logger.LogInformation("Found {Count} ended marathons to complete", endedMarathons.Count);

        foreach (var marathon in endedMarathons)
        {
            // Mark all Active participants as Completed
            var activeParticipants = marathon.Participants
                .Where(p => p.Status == MarathonStatus.Active)
                .ToList();

            foreach (var participant in activeParticipants)
            {
                participant.Status = MarathonStatus.Completed;
            }

            // Mark marathon as inactive
            marathon.IsActive = false;

            _logger.LogInformation(
                "Completed marathon '{Title}' (ID: {Id}), marked {Count} participants as completed",
                marathon.Title,
                marathon.Id,
                activeParticipants.Count);
        }

        await context.SaveChangesAsync();
        _logger.LogInformation("Successfully completed {Count} marathons", endedMarathons.Count);
    }
}
