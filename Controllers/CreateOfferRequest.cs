namespace MS.VideoConference.Controllers
{
    public partial class SignalController
    {
        public class CreateOfferRequest
        {
            public string clientId { get; set; }
            public SDPOffer offer { get; set; }
        }
    }
}
