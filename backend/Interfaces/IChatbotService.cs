namespace backend.Interfaces
{
    public interface IChatbotService
    {
        Task<ChatbotAnswer> RepondreAsync(string question, CancellationToken cancellationToken = default);
    }

    public sealed record ChatbotAnswer(string Reply, string? SourceTitle, bool Matched);
}
