using System.Collections.Concurrent;
using backend.Controllers.Common;
using backend.Dtos.Message;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/chatbot")]
    public sealed class ChatbotController : ControllerBase
    {
        private static readonly ConcurrentDictionary<Guid, SemaphoreSlim> ConversationLocks = new();
        private readonly IChatbotService _chatbot;
        private readonly IConversationService _conversations;
        private readonly IMessageService _messages;

        public ChatbotController(
            IChatbotService chatbot,
            IConversationService conversations,
            IMessageService messages)
        {
            _chatbot = chatbot;
            _conversations = conversations;
            _messages = messages;
        }

        [AllowAnonymous]
        [EnableRateLimiting("chatbot")]
        [HttpPost("repondre")]
        public async Task<ActionResult<ChatbotReplyDto>> Repondre(
            [FromBody] ChatbotQuestionDto request,
            CancellationToken cancellationToken)
        {
            var answer = await _chatbot.RepondreAsync(request.Message, cancellationToken);
            return Ok(new ChatbotReplyDto(answer.Reply, answer.SourceTitle, answer.Matched));
        }

        // Persiste la réponse automatique dans le fil pour qu'elle reste visible après le
        // rafraîchissement et apparaisse aussi dans la messagerie de l'équipe.
        [Authorize]
        [EnableRateLimiting("chatbot")]
        [HttpPost("conversations/{conversationId:guid}/repondre")]
        public async Task<ActionResult<MessageDto>> RepondreDansConversation(
            Guid conversationId,
            [FromBody] ChatbotQuestionDto request,
            CancellationToken cancellationToken)
        {
            var conversation = await _conversations.GetByIdAsync(conversationId);
            if (conversation is null) return NotFound();
            if (!this.IsAdmin() && conversation.ClientId != this.GetUserId()) return Forbid();

            var answer = await _chatbot.RepondreAsync(request.Message, cancellationToken);
            var replyMessage = await _messages.CreateAsync(
                new CreateMessageDto { ConversationId = conversationId, Contenu = answer.Reply },
                "admin");

            return Ok(replyMessage);
        }

        [Authorize]
        [EnableRateLimiting("chatbot")]
        [HttpPost("conversations/{conversationId:guid}/repondre-dernier")]
        public async Task<ActionResult<MessageDto>> RepondreAuDernierMessage(
            Guid conversationId,
            CancellationToken cancellationToken)
        {
            var conversation = await _conversations.GetByIdAsync(conversationId);
            if (conversation is null) return NotFound();
            if (!this.IsAdmin() && conversation.ClientId != this.GetUserId()) return Forbid();

            var verrou = ConversationLocks.GetOrAdd(conversationId, _ => new SemaphoreSlim(1, 1));
            await verrou.WaitAsync(cancellationToken);
            try
            {
                var messages = (await _messages.GetByConversationIdAsync(conversationId)).ToList();
                var dernier = messages.LastOrDefault();
                if (dernier is null || dernier.Sender != "client") return NoContent();

                var answer = await _chatbot.RepondreAsync(dernier.Contenu, cancellationToken);
                var replyMessage = await _messages.CreateAsync(
                    new CreateMessageDto { ConversationId = conversationId, Contenu = answer.Reply },
                    "admin");
                return Ok(replyMessage);
            }
            finally
            {
                verrou.Release();
            }
        }
    }

    public sealed class ChatbotQuestionDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.StringLength(5000, MinimumLength = 1)]
        public string Message { get; set; } = string.Empty;
    }

    public sealed record ChatbotReplyDto(string Reply, string? SourceTitle, bool Matched);
}
