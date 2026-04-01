using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StopSmoke.Backend.Data;
using StopSmoke.Backend.DTOs;
using StopSmoke.Backend.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace StopSmoke.Backend.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class ProfileController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _context;

    public ProfileController(UserManager<User> userManager, ApplicationDbContext context)
    {
        _userManager = userManager;
        _context = context;
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

        // Count completed marathons
        var completedMarathonsCount = await _context.MarathonParticipants
            .Where(p => p.UserId == userId && p.Status == MarathonStatus.Completed)
            .CountAsync();

        var profile = new UserProfileDto
        {
            Email = user.Email!,
            Name = user.Name,
            QuitDate = user.QuitDate,
            CigarettesPerDay = user.CigarettesPerDay,
            PricePerPack = user.PricePerPack,
            Currency = user.Currency,
            IsAdmin = user.IsAdmin,
            CompletedMarathonsCount = completedMarathonsCount,
            ShowInLeaderboard = user.ShowInLeaderboard,
            AvatarUrl = user.AvatarUrl,
            AvatarThumbnailUrl = user.AvatarThumbnailUrl
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

        // Валидация даты: не в будущем и не более 30 лет назад
        if (model.QuitDate.HasValue)
        {
            if (model.QuitDate.Value > DateTime.UtcNow)
            {
                return BadRequest(new { message = "Quit date cannot be in the future" });
            }

            var thirtyYearsAgo = DateTime.UtcNow.AddYears(-30);
            if (model.QuitDate.Value < thirtyYearsAgo)
            {
                return BadRequest(new { message = "Quit date cannot be more than 30 years ago" });
            }
        }

        user.QuitDate = model.QuitDate;
        user.CigarettesPerDay = model.CigarettesPerDay;
        user.PricePerPack = model.PricePerPack;
        user.Currency = model.Currency;
        user.ShowInLeaderboard = model.ShowInLeaderboard;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok(new { Message = "Profile updated successfully" });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPublicProfile(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found" });

        var completedMarathonsCount = await _context.MarathonParticipants
            .Where(p => p.UserId == id && p.Status == MarathonStatus.Completed)
            .CountAsync();

        var publicProfile = new PublicProfileDto
        {
            Id = user.Id,
            Name = user.Name ?? user.Email ?? "Unknown",
            Email = user.Email ?? "",
            QuitDate = user.QuitDate,
            LastSeen = user.LastSeen,
            CompletedMarathonsCount = completedMarathonsCount,
            AvatarUrl = user.AvatarUrl,
            AvatarThumbnailUrl = user.AvatarThumbnailUrl
        };

        return Ok(publicProfile);
    }

    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile? file)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFound();

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded." });

        // Build uploads folder path (wwwroot/uploads/avatars)
        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        // Generate unique filename
        var extension = Path.GetExtension(file.FileName);
        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var thumbFileName = $"thumb_{uniqueFileName}";
        
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);
        var thumbPath = Path.Combine(uploadsFolder, thumbFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Generate thumbnail
        using (var image = await Image.LoadAsync(filePath))
        {
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Size = new Size(150, 150),
                Mode = ResizeMode.Crop
            }));
            await image.SaveAsync(thumbPath);
        }

        // Delete previous avatar file if exists
        if (!string.IsNullOrEmpty(user.AvatarUrl) && user.AvatarUrl.StartsWith("/uploads/avatars/"))
        {
            var oldFileName = Path.GetFileName(user.AvatarUrl);
            var oldFilePath = Path.Combine(uploadsFolder, oldFileName);
            if (System.IO.File.Exists(oldFilePath))
            {
                System.IO.File.Delete(oldFilePath);
            }
        }
        
        if (!string.IsNullOrEmpty(user.AvatarThumbnailUrl) && user.AvatarThumbnailUrl.StartsWith("/uploads/avatars/"))
        {
            var oldThumbFileName = Path.GetFileName(user.AvatarThumbnailUrl);
            var oldThumbFilePath = Path.Combine(uploadsFolder, oldThumbFileName);
            if (System.IO.File.Exists(oldThumbFilePath))
            {
                System.IO.File.Delete(oldThumbFilePath);
            }
        }

        // Update user
        user.AvatarUrl = $"/uploads/avatars/{uniqueFileName}";
        user.AvatarThumbnailUrl = $"/uploads/avatars/{thumbFileName}";
        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok(new { 
            AvatarUrl = user.AvatarUrl, 
            AvatarThumbnailUrl = user.AvatarThumbnailUrl,
            Message = "Avatar uploaded successfully" 
        });
    }
}
