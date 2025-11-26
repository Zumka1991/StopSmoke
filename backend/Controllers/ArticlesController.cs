using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StopSmoke.Backend.Attributes;
using StopSmoke.Backend.Data;
using StopSmoke.Backend.DTOs;
using StopSmoke.Backend.Models;

namespace StopSmoke.Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ArticlesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;

    public ArticlesController(ApplicationDbContext context, UserManager<User> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    // GET: api/articles - Public endpoint for published articles
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ArticleDto>>> GetPublishedArticles()
    {
        var articles = await _context.Articles
            .Where(a => a.IsPublished)
            .Include(a => a.Author)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new ArticleDto
            {
                Id = a.Id,
                Title = a.Title,
                Content = a.Content,
                Summary = a.Summary,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                IsPublished = a.IsPublished,
                AuthorName = a.Author != null ? a.Author.Name ?? a.Author.UserName : "Unknown"
            })
            .ToListAsync();

        return Ok(articles);
    }

    // GET: api/articles/{id} - Public endpoint for single published article
    [HttpGet("{id}")]
    public async Task<ActionResult<ArticleDto>> GetArticle(int id)
    {
        var article = await _context.Articles
            .Include(a => a.Author)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (article == null)
            return NotFound();

        // Non-admins can only view published articles
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var isAdmin = false;

        if (userId != null)
        {
            var user = await _userManager.FindByIdAsync(userId);
            isAdmin = user?.IsAdmin ?? false;
        }

        if (!article.IsPublished && !isAdmin)
            return NotFound();

        var articleDto = new ArticleDto
        {
            Id = article.Id,
            Title = article.Title,
            Content = article.Content,
            Summary = article.Summary,
            CreatedAt = article.CreatedAt,
            UpdatedAt = article.UpdatedAt,
            IsPublished = article.IsPublished,
            AuthorName = article.Author != null ? article.Author.Name ?? article.Author.UserName : "Unknown"
        };

        return Ok(articleDto);
    }

    // GET: api/articles/admin/all - Admin endpoint for all articles
    [Authorize]
    [RequireAdmin]
    [HttpGet("admin/all")]
    public async Task<ActionResult<IEnumerable<ArticleDto>>> GetAllArticlesForAdmin()
    {
        var articles = await _context.Articles
            .Include(a => a.Author)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new ArticleDto
            {
                Id = a.Id,
                Title = a.Title,
                Content = a.Content,
                Summary = a.Summary,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                IsPublished = a.IsPublished,
                AuthorName = a.Author != null ? a.Author.Name ?? a.Author.UserName : "Unknown"
            })
            .ToListAsync();

        return Ok(articles);
    }

    // POST: api/articles - Admin endpoint to create article
    [Authorize]
    [RequireAdmin]
    [HttpPost]
    public async Task<ActionResult<ArticleDto>> CreateArticle([FromBody] CreateArticleDto createDto)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
            return Unauthorized();

        var article = new Article
        {
            Title = createDto.Title,
            Content = createDto.Content,
            Summary = createDto.Summary,
            IsPublished = createDto.IsPublished,
            AuthorId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        // Reload with author info
        await _context.Entry(article).Reference(a => a.Author).LoadAsync();

        var articleDto = new ArticleDto
        {
            Id = article.Id,
            Title = article.Title,
            Content = article.Content,
            Summary = article.Summary,
            CreatedAt = article.CreatedAt,
            UpdatedAt = article.UpdatedAt,
            IsPublished = article.IsPublished,
            AuthorName = article.Author != null ? article.Author.Name ?? article.Author.UserName : "Unknown"
        };

        return CreatedAtAction(nameof(GetArticle), new { id = article.Id }, articleDto);
    }

    // PUT: api/articles/{id} - Admin endpoint to update article
    [Authorize]
    [RequireAdmin]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateArticle(int id, [FromBody] UpdateArticleDto updateDto)
    {
        var article = await _context.Articles.FindAsync(id);
        if (article == null)
            return NotFound();

        article.Title = updateDto.Title;
        article.Content = updateDto.Content;
        article.Summary = updateDto.Summary;
        article.IsPublished = updateDto.IsPublished;
        article.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/articles/{id} - Admin endpoint to delete article
    [Authorize]
    [RequireAdmin]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteArticle(int id)
    {
        var article = await _context.Articles.FindAsync(id);
        if (article == null)
            return NotFound();

        _context.Articles.Remove(article);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
