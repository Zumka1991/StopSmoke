using MailKit.Net.Smtp;
using MimeKit;

namespace StopSmoke.Backend.Services;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string body);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        var smtpSettings = _config.GetSection("Smtp");
        var fromEmail = smtpSettings["UserName"];
        var fromName = smtpSettings["FromName"] ?? "StopSmoke Support";

        var email = new MimeMessage();
        email.From.Add(new MailboxAddress(fromName, fromEmail));
        email.To.Add(MailboxAddress.Parse(toEmail));
        email.Subject = subject;

        var builder = new BodyBuilder { HtmlBody = body };
        email.Body = builder.ToMessageBody();

        using var smtp = new SmtpClient();
        try
        {
            // 587 - STARTTLS, 465 - SSL
            var secureOption = int.Parse(smtpSettings["Port"] ?? "587") == 465 
                ? MailKit.Security.SecureSocketOptions.SslOnConnect 
                : MailKit.Security.SecureSocketOptions.StartTls;

            await smtp.ConnectAsync(smtpSettings["Host"], int.Parse(smtpSettings["Port"] ?? "587"), secureOption);
            await smtp.AuthenticateAsync(smtpSettings["UserName"], smtpSettings["Password"]);
            await smtp.SendAsync(email);
        }
        finally
        {
            await smtp.DisconnectAsync(true);
        }
    }
}