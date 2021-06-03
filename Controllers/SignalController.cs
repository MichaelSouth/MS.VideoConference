using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;

namespace MS.VideoConference.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class SignalController : ControllerBase
    {
        private readonly ILogger<SignalController> _logger;
        private static readonly Dictionary<string, SDPOffer> _offers = new Dictionary<string, SDPOffer>();

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
        public IActionResult CreateOffer(string clientId, SDPOffer offer)
        {
            _logger.LogInformation($"CreateOffer called by {clientId}{offer.Type}: {offer.SDP}");

            _offers.Add(clientId, offer);

            return Ok();
        }

        /// <summary>
        /// Get all Temperature Sensors
        /// </summary>
        [HttpGet]
        [Route("GetOffers")]
        public ActionResult<IEnumerable<SDPOffer>> GetOffers(string clientId)
        {
            _logger.LogInformation($"GetOffers called {clientId}");

            return _offers.Where(x => x.Key != clientId).Select(x => x.Value).ToList();
        }
    }
}
