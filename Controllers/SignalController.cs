using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace MS.VideoConference.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class SignalController : ControllerBase
    {
        private readonly ILogger<SignalController> _logger;

        public SignalController(ILogger<SignalController> logger)
        {
            _logger = logger;
        }

        [HttpGet]
        public ActionResult Get()
        {
            return Ok();
        }
    }
}
