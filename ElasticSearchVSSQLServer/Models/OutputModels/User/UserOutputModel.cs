using ElasticSearchVSSQLServer.Persistence.Shared;

namespace ElasticSearchVSSQLServer.RestApi.Models.OutputModels.User;

public class UserOutputModel
{
    public string Id { get; set; }

    public string Firstname { get; set; }

    public string Lastname { get; set; }

    public string UserName { get; set; }

    public string PersonalNumber { get; set; }

    public string PhoneNumber { get; set; }

    public string Email { get; set; }

    public string? ImageProfile { get; set; }

    public DateTime? Birthdate { get; set; }

    public int? Gender { get; set; }

    public bool EmailConfirmed { get; set; }

    public LanguageEnum Language { get; set; }
    public int? DomainId { get; set; }

    public DateTime? ActivationDate { get; set; }

    public DateTime? ExpirationDate { get; set; }


}
