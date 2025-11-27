using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StopSmoke.Backend.Data;
using StopSmoke.Backend.DTOs;
using StopSmoke.Backend.Models;
using System.Security.Claims;

namespace StopSmoke.Backend.Controllers;

[ApiController]
[Route("api/articles/{articleId}/[controller]")]
public class CommentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;

    public CommentsController(ApplicationDbContext context, UserManager<User> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    // GET: api/articles/{articleId}/comments - Public endpoint with pagination
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<CommentDto>>> GetComments(int articleId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 50) pageSize = 50; // Max 50 comments per page

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var query = _context.Comments
            .Include(c => c.User)
            .Where(c => c.ArticleId == articleId)
            .OrderByDescending(c => c.CreatedAt);

        var totalCount = await query.CountAsync();

        var comments = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CommentDto
            {
                Id = c.Id,
                Content = c.Content,
                CreatedAt = c.CreatedAt,
                ArticleId = c.ArticleId,
                UserId = c.UserId,
                UserName = c.User.Name ?? c.User.UserName ?? "Anonymous",
                IsAuthor = c.UserId == currentUserId
            })
            .ToListAsync();

        var result = new PaginatedResult<CommentDto>
        {
            Items = comments,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(result);
    }

    // POST: api/articles/{articleId}/comments - Requires authentication
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<CommentDto>> CreateComment(int articleId, [FromBody] CreateCommentDto createDto)
    {
        // Check if article exists
        var articleExists = await _context.Articles.AnyAsync(a => a.Id == articleId);
        if (!articleExists)
        {
            return NotFound("Article not found");
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            return Unauthorized();
        }

        var comment = new Comment
        {
            Content = createDto.Content,
            ArticleId = articleId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        // Reload with user info
        await _context.Entry(comment).Reference(c => c.User).LoadAsync();

        var commentDto = new CommentDto
        {
            Id = comment.Id,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            ArticleId = comment.ArticleId,
            UserId = comment.UserId,
            UserName = comment.User.Name ?? comment.User.UserName ?? "Anonymous",
            IsAuthor = true
        };

        return CreatedAtAction(nameof(GetComments), new { articleId = comment.ArticleId }, commentDto);
    }

    // DELETE: api/articles/{articleId}/comments/{id} - User can delete their own, admin can delete any
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteComment(int articleId, int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            return Unauthorized();
        }

        var comment = await _context.Comments.FindAsync(id);
        if (comment == null || comment.ArticleId != articleId)
        {
            return NotFound();
        }

        var user = await _userManager.FindByIdAsync(userId);

        // User can delete own comment or admin can delete any
        if (comment.UserId != userId && user?.IsAdmin != true)
        {
            return Forbid();
        }

        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
