using System.Text.Json;
using System.Text.Json.Serialization;

namespace StopSmoke.Backend.Services;

public interface IRecaptchaService
{
    Task<bool> VerifyTokenAsync(string token);
}

public class RecaptchaService : IRecaptchaService
{
    private readonly HttpClient _httpClient;
    private readonly string _secretKey;
    private readonly ILogger<RecaptchaService> _logger;

    public RecaptchaService(HttpClient httpClient, IConfiguration configuration, ILogger<RecaptchaService> logger)
    {
        _httpClient = httpClient;
        _secretKey = configuration["Recaptcha:SecretKey"]
            ?? "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"; // Test key
        _logger = logger;
    }

    public async Task<bool> VerifyTokenAsync(string token)
    {
        if (string.IsNullOrEmpty(token))
        {
            _logger.LogWarning("reCAPTCHA token is empty");
            return false;
        }

        try
        {
            var response = await _httpClient.PostAsync(
                $"https://www.google.com/recaptcha/api/siteverify?secret={_secretKey}&response={token}",
                null
            );

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("reCAPTCHA API returned status code: {StatusCode}", response.StatusCode);
                return false;
            }

            var jsonString = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("reCAPTCHA API response: {Response}", jsonString);

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            var result = JsonSerializer.Deserialize<RecaptchaResponse>(jsonString, options);

            if (result?.Success == true)
            {
                _logger.LogInformation("reCAPTCHA verification successful");
                return true;
            }

            _logger.LogWarning("reCAPTCHA verification failed. Error codes: {Errors}",
                result?.ErrorCodes != null ? string.Join(", ", result.ErrorCodes) : "none");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception during reCAPTCHA verification");
            return false;
        }
    }

    private class RecaptchaResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("challenge_ts")]
        public string? ChallengeTs { get; set; }

        [JsonPropertyName("hostname")]
        public string? Hostname { get; set; }

        [JsonPropertyName("error-codes")]
        public string[]? ErrorCodes { get; set; }
    }
}
