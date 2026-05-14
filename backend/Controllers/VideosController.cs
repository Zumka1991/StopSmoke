using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StopSmoke.Backend.Attributes;
using StopSmoke.Backend.Data;
using StopSmoke.Backend.DTOs;
using StopSmoke.Backend.Models;

namespace StopSmoke.Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class VideosController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public VideosController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/videos
    [HttpGet]
    public async Task<ActionResult<IEnumerable<VideoResponse>>> GetVideos()
    {
        return await _context.Videos
            .OrderByDescending(v => v.CreatedAt)
            .Select(v => new VideoResponse
            {
                Id = v.Id,
                Title = v.Title,
                Description = v.Description,
                VideoUrl = v.VideoUrl,
                Platform = v.Platform,
                ThumbnailUrl = v.ThumbnailUrl,
                CreatedAt = v.CreatedAt
            })
            .ToListAsync();
    }

    // GET: api/videos/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<VideoResponse>> GetVideo(int id)
    {
        var video = await _context.Videos.FindAsync(id);
        if (video == null) return NotFound();

        return Ok(new VideoResponse
        {
            Id = video.Id,
            Title = video.Title,
            Description = video.Description,
            VideoUrl = video.VideoUrl,
            Platform = video.Platform,
            ThumbnailUrl = video.ThumbnailUrl,
            CreatedAt = video.CreatedAt
        });
    }

    // POST: api/videos
    [Authorize]
    [RequireAdmin]
    [HttpPost]
    public async Task<ActionResult<VideoResponse>> CreateVideo([FromBody] CreateVideoRequest request)
    {
        var platform = DetectPlatform(request.VideoUrl);
        var thumbnail = request.ThumbnailUrl ?? GenerateThumbnailUrl(request.VideoUrl, platform);

        var video = new Video
        {
            Title = request.Title,
            Description = request.Description,
            VideoUrl = request.VideoUrl,
            Platform = platform,
            ThumbnailUrl = thumbnail,
            CreatedAt = DateTime.UtcNow
        };

        _context.Videos.Add(video);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetVideo), new { id = video.Id }, new VideoResponse
        {
            Id = video.Id,
            Title = video.Title,
            Description = video.Description,
            VideoUrl = video.VideoUrl,
            Platform = video.Platform,
            ThumbnailUrl = video.ThumbnailUrl,
            CreatedAt = video.CreatedAt
        });
    }

    // PUT: api/videos/{id}
    [Authorize]
    [RequireAdmin]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateVideo(int id, [FromBody] UpdateVideoRequest request)
    {
        var video = await _context.Videos.FindAsync(id);
        if (video == null) return NotFound();

        if (request.Title != null) video.Title = request.Title;
        if (request.Description != null) video.Description = request.Description;
        if (request.VideoUrl != null)
        {
            video.VideoUrl = request.VideoUrl;
            video.Platform = DetectPlatform(request.VideoUrl);
            video.ThumbnailUrl = request.ThumbnailUrl ?? GenerateThumbnailUrl(request.VideoUrl, video.Platform);
        }
        else if (request.ThumbnailUrl != null)
        {
            video.ThumbnailUrl = request.ThumbnailUrl;
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/videos/{id}
    [Authorize]
    [RequireAdmin]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVideo(int id)
    {
        var video = await _context.Videos.FindAsync(id);
        if (video == null) return NotFound();

        _context.Videos.Remove(video);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Helper: detect platform from URL
    private static string DetectPlatform(string url)
    {
        if (string.IsNullOrEmpty(url)) return "Other";
        var lower = url.ToLowerInvariant();
        if (lower.Contains("youtube.com") || lower.Contains("youtu.be")) return "YouTube";
        if (lower.Contains("rutube.ru")) return "RuTube";
        return "Other";
    }

    // Helper: generate thumbnail URL
    private static string? GenerateThumbnailUrl(string url, string platform)
    {
        var videoId = ExtractVideoId(url, platform);
        if (platform == "YouTube" && !string.IsNullOrEmpty(videoId))
        {
            return $"https://img.youtube.com/vi/{videoId}/mqdefault.jpg";
        }
        // RuTube thumbnails require API; leave null for manual upload or future enhancement
        return null;
    }

    // Helper: extract video ID
    private static string? ExtractVideoId(string url, string platform)
    {
        if (platform == "YouTube")
        {
            // youtu.be/{id}
            var shortMatch = Regex.Match(url, @"youtu\.be/([^?&/]+)");
            if (shortMatch.Success) return shortMatch.Groups[1].Value;

            // youtube.com/watch?v={id}
            var watchMatch = Regex.Match(url, @"[?&]v=([^?&/]+)");
            if (watchMatch.Success) return watchMatch.Groups[1].Value;

            // youtube.com/embed/{id}
            var embedMatch = Regex.Match(url, @"youtube\.com/embed/([^?&/]+)");
            if (embedMatch.Success) return embedMatch.Groups[1].Value;
        }
        else if (platform == "RuTube")
        {
            // rutube.ru/video/{id}/
            var match = Regex.Match(url, @"rutube\.ru/video/([^?&/]+)");
            if (match.Success) return match.Groups[1].Value;

            // rutube.ru/play/embed/{id}
            var embedMatch = Regex.Match(url, @"rutube\.ru/play/embed/([^?&/]+)");
            if (embedMatch.Success) return embedMatch.Groups[1].Value;
        }
        return null;
    }
}
