using ElasticSearchVSSQLServer.Persistence.Shared;

namespace ElasticSearchVSSQLServer.RestApi.Models.OutputModels.User
{
    public class CurrentUserOutputModel
    {
        public string Id { get; set; }

        public string Firstname { get; set; }

        public string Lastname { get; set; }

        public string UserName { get; set; }

        public string PersonalNumber { get; set; }

        public string PhoneNumber { get; set; }

        public int? CityId { get; set; }

        public string Email { get; set; }

        public DateTime? Birthdate { get; set; }

        public int? Gender { get; set; }

        public bool? EmailConfirmed { get; set; }

        public bool? TwoFactorEnabled { get; set; }

        public LanguageEnum Language { get; set; }

        public bool? ChangePassword { get; set; }
    }
}
