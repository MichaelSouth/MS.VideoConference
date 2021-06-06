using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;

namespace MS.VideoConference.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public partial class SignalController : ControllerBase
    {
        private readonly ILogger<SignalController> _logger;
        private static readonly List<Message> _messages = new List<Message>();

        public SignalController(ILogger<SignalController> logger)
        {
            _logger = logger;
        }

        [HttpGet]
        public ActionResult Get()
        {
            return Ok();
        }

        [HttpPost]
        [Route("CreateOffer")]
        public IActionResult CreateOffer(Message message)
        {
            _logger.LogInformation($"CreateOffer {message.ClientId}{message.Type}: {message.Data}");

            lock (_messages)
            {
                _messages.Add(message);
            }

            return Ok();
        }

        [HttpPost]
        [Route("SendCandidate")]
        public IActionResult SendCandidate(Message message)
        {
            _logger.LogInformation($"SendCandidate {message.ClientId}{message.Type}: {message.Data}");

            lock (_messages)
            {
                _messages.Add(message);
            }

            return Ok();
        }

        [HttpGet]
        [Route("GetMessages")]
        public ActionResult<IEnumerable<Message>> GetMessages(string clientId)
        {
            _logger.LogInformation($"GetMessages called {clientId}");

            lock (_messages)
            {
                var tempMessages = _messages.Where(x => x.ClientId != clientId).ToArray();

                foreach (var kvp in tempMessages)
                {
                    _messages.Remove(kvp);
                }

                return tempMessages;
            }
        }
    }
}
