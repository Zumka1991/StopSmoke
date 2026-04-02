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
public class BooksController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public BooksController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/books
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BookResponse>>> GetBooks()
    {
        return await _context.Books
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new BookResponse
            {
                Id = b.Id,
                Title = b.Title,
                Author = b.Author,
                Description = b.Description,
                CoverImageUrl = b.CoverImageUrl,
                Fb2FragmentUrl = b.Fb2FragmentUrl,
                ExternalUrl = b.ExternalUrl,
                CreatedAt = b.CreatedAt
            })
            .ToListAsync();
    }

    // GET: api/books/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<BookResponse>> GetBook(int id)
    {
        var book = await _context.Books.FindAsync(id);

        if (book == null)
            return NotFound();

        return Ok(new BookResponse
        {
            Id = book.Id,
            Title = book.Title,
            Author = book.Author,
            Description = book.Description,
            CoverImageUrl = book.CoverImageUrl,
            Fb2FragmentUrl = book.Fb2FragmentUrl,
            ExternalUrl = book.ExternalUrl,
            CreatedAt = book.CreatedAt
        });
    }

    // POST: api/books
    [Authorize]
    [RequireAdmin]
    [HttpPost]
    public async Task<ActionResult<BookResponse>> CreateBook([FromBody] CreateBookRequest request)
    {
        var book = new Book
        {
            Title = request.Title,
            Author = request.Author,
            Description = request.Description,
            ExternalUrl = request.ExternalUrl,
            CreatedAt = DateTime.UtcNow
        };

        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBook), new { id = book.Id }, new BookResponse
        {
            Id = book.Id,
            Title = book.Title,
            Author = book.Author,
            Description = book.Description,
            ExternalUrl = book.ExternalUrl,
            CreatedAt = book.CreatedAt
        });
    }

    // PUT: api/books/{id}
    [Authorize]
    [RequireAdmin]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBook(int id, [FromBody] UpdateBookRequest request)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null)
            return NotFound();

        if (request.Title != null) book.Title = request.Title;
        if (request.Author != null) book.Author = request.Author;
        if (request.Description != null) book.Description = request.Description;
        if (request.ExternalUrl != null) book.ExternalUrl = request.ExternalUrl;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // POST: api/books/upload-cover/{id}
    [Authorize]
    [RequireAdmin]
    [HttpPost("upload-cover/{id}")]
    public async Task<IActionResult> UploadCover(int id, IFormFile file)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return NotFound();

        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "books", "covers");
        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

        var extension = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Delete old cover if exists
        if (!string.IsNullOrEmpty(book.CoverImageUrl))
        {
            var oldPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", book.CoverImageUrl.TrimStart('/'));
            if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
        }

        book.CoverImageUrl = $"/uploads/books/covers/{fileName}";
        await _context.SaveChangesAsync();

        return Ok(new { CoverImageUrl = book.CoverImageUrl });
    }

    // POST: api/books/upload-fb2/{id}
    [Authorize]
    [RequireAdmin]
    [HttpPost("upload-fb2/{id}")]
    public async Task<IActionResult> UploadFb2(int id, IFormFile file)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return NotFound();

        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "books", "fragments");
        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

        var extension = Path.GetExtension(file.FileName);
        if (extension.ToLower() != ".fb2")
            return BadRequest("Only .fb2 files are allowed.");

        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Delete old fragment if exists
        if (!string.IsNullOrEmpty(book.Fb2FragmentUrl))
        {
            var oldPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", book.Fb2FragmentUrl.TrimStart('/'));
            if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
        }

        book.Fb2FragmentUrl = $"/uploads/books/fragments/{fileName}";
        await _context.SaveChangesAsync();

        return Ok(new { Fb2FragmentUrl = book.Fb2FragmentUrl });
    }

    // DELETE: api/books/{id}
    [Authorize]
    [RequireAdmin]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBook(int id)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return NotFound();

        // Delete files
        if (!string.IsNullOrEmpty(book.CoverImageUrl))
        {
            var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", book.CoverImageUrl.TrimStart('/'));
            if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
        }
        if (!string.IsNullOrEmpty(book.Fb2FragmentUrl))
        {
            var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", book.Fb2FragmentUrl.TrimStart('/'));
            if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
        }

        _context.Books.Remove(book);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
