using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using StopSmoke.Backend.DTOs;
using StopSmoke.Backend.Models;
using StopSmoke.Backend.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace StopSmoke.Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _configuration;
    private readonly IRecaptchaService _recaptchaService;
    private readonly IEmailService _emailService;

    public AuthController(
        UserManager<User> userManager,
        IConfiguration configuration,
        IRecaptchaService recaptchaService,
        IEmailService emailService)
    {
        _userManager = userManager;
        _configuration = configuration;
        _recaptchaService = recaptchaService;
        _emailService = emailService;
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] string email)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            // Security: Don't reveal if user exists
            return Ok(new { message = "If the email exists, a reset link has been sent." });
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        // Important: Encode token for URL
        var encodedToken = Uri.EscapeDataString(token);
        
        // Link to frontend
        var resetLink = $"https://stopsmoke.info/reset-password?email={Uri.EscapeDataString(email)}&token={encodedToken}";

        var subject = "Сброс пароля - StopSmoke";
        var body = $@"
            <h3>Привет, {user.UserName ?? user.Email}!</h3>
            <p>Вы (или кто-то другой) запросили восстановление пароля.</p>
            <p>Нажмите на кнопку ниже, чтобы установить новый пароль:</p>
            <a href='{resetLink}' style='background:#3b82f6;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;margin:10px 0;'>Сменить пароль</a>
            <p style='color:#666;font-size:12px;'>Если вы этого не делали, просто проигнорируйте это письмо.</p>
        ";

        try
        {
            await _emailService.SendEmailAsync(email, subject, body);
            return Ok(new { message = "Письмо отправлено" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Auth] Email Error: {ex.Message}");
            return StatusCode(500, new { error = "Ошибка при отправке письма" });
        }
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
        {
            return BadRequest(new { error = "Пользователь не найден" });
        }

        // Decode token from URL
        var token = Uri.UnescapeDataString(model.Token);

        var result = await _userManager.ResetPasswordAsync(user, token, model.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        return Ok(new { message = "Пароль успешно изменен" });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Verify reCAPTCHA
        var isRecaptchaValid = await _recaptchaService.VerifyTokenAsync(model.RecaptchaToken);
        if (!isRecaptchaValid)
            return BadRequest(new { Message = "reCAPTCHA verification failed. Please try again." });

        var userExists = await _userManager.FindByEmailAsync(model.Email);
        if (userExists != null)
            return BadRequest(new { Message = "User already exists" });

        var user = new User
        {
            Email = model.Email,
            Name = model.Name,
            SecurityStamp = Guid.NewGuid().ToString(),
            UserName = model.Email
        };

        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
            return BadRequest(new { Message = "User creation failed", Errors = result.Errors });

        return Ok(new { Message = "User created successfully" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
        {
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName!),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id)
            };

            var token = GetToken(authClaims);

            return Ok(new AuthResponseDto
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Expiration = token.ValidTo,
                Email = user.Email!,
                UserId = user.Id
            });
        }

        return Unauthorized();
    }

    private JwtSecurityToken GetToken(List<Claim> authClaims)
    {
        var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            expires: DateTime.Now.AddDays(30),
            claims: authClaims,
            signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
        );

        return token;
    }
}

// DTO for Reset Password
public record ResetPasswordDto(string Email, string Token, string NewPassword);
