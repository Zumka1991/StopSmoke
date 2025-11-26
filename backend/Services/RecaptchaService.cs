using System.Text.Json;

namespace StopSmoke.Backend.Services;

public interface IRecaptchaService
{
    Task<bool> VerifyTokenAsync(string token);
}

public class RecaptchaService : IRecaptchaService
{
    private readonly HttpClient _httpClient;
    private readonly string _secretKey;

    public RecaptchaService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _secretKey = configuration["Recaptcha:SecretKey"]
            ?? "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"; // Test key
    }

    public async Task<bool> VerifyTokenAsync(string token)
    {
        if (string.IsNullOrEmpty(token))
            return false;

        try
        {
            var response = await _httpClient.PostAsync(
                $"https://www.google.com/recaptcha/api/siteverify?secret={_secretKey}&response={token}",
                null
            );

            if (!response.IsSuccessStatusCode)
                return false;

            var jsonString = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<RecaptchaResponse>(jsonString);

            return result?.Success ?? false;
        }
        catch
        {
            return false;
        }
    }

    private class RecaptchaResponse
    {
        public bool Success { get; set; }
        public DateTime ChallengeTs { get; set; }
        public string Hostname { get; set; } = string.Empty;
    }
}
