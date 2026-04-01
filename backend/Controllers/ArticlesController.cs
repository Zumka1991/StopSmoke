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

    // GET: api/articles - Public endpoint for published articles with pagination
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<ArticleDto>>> GetPublishedArticles([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 50) pageSize = 50; // Max 50 items per page

        var query = _context.Articles
            .Where(a => a.IsPublished)
            .Include(a => a.Author)
            .OrderByDescending(a => a.CreatedAt);

        var totalCount = await query.CountAsync();

        var articles = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new ArticleDto
            {
                Id = a.Id,
                Title = a.Title,
                Content = a.Content,
                Summary = a.Summary,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                IsPublished = a.IsPublished,
                AuthorName = a.Author != null ? a.Author.Name ?? a.Author.UserName : "Unknown",
                ImageUrl = a.ImageUrl
            })
            .ToListAsync();

        var result = new PaginatedResult<ArticleDto>
        {
            Items = articles,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(result);
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
            AuthorName = article.Author != null ? article.Author.Name ?? article.Author.UserName : "Unknown",
            ImageUrl = article.ImageUrl
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
                AuthorName = a.Author != null ? a.Author.Name ?? a.Author.UserName : "Unknown",
                ImageUrl = a.ImageUrl
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
            ImageUrl = createDto.ImageUrl,
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
            AuthorName = article.Author != null ? article.Author.Name ?? article.Author.UserName : "Unknown",
            ImageUrl = article.ImageUrl
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
        article.ImageUrl = updateDto.ImageUrl;
        article.IsPublished = updateDto.IsPublished;
        article.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/articles/upload-image - Admin endpoint to upload article image
    [Authorize]
    [RequireAdmin]
    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadArticleImage(IFormFile? file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded." });

        // Build uploads folder path (wwwroot/uploads/articles)
        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "articles");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        // Generate unique filename
        var extension = Path.GetExtension(file.FileName);
        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var imageUrl = $"/uploads/articles/{uniqueFileName}";
        return Ok(new { ImageUrl = imageUrl });
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

        // Delete associated image if it exists
        if (!string.IsNullOrEmpty(article.ImageUrl) && article.ImageUrl.StartsWith("/uploads/articles/"))
        {
            var fileName = Path.GetFileName(article.ImageUrl);
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "articles", fileName);
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }

        _context.Articles.Remove(article);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
