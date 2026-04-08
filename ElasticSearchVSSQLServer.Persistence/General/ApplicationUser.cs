using Microsoft.AspNetCore.Identity;
using ElasticSearchVSSQLServer.Persistence.Shared;

namespace ElasticSearchVSSQLServer.Persistence.General;
public class ApplicationUser : IdentityUser
{
    public ApplicationUser()
    {
        Language = LanguageEnum.Albanian;
        InsertedDate = DateTime.Now;
        Gender = GenderEnum.Male;
        ConcurrencyStamp = Guid.NewGuid().ToString();
    }

    public string Firstname { get; set; }
    public string Lastname { get; set; }
    public string PersonalNumber { get; set; }
    public DateTime? Birthdate { get; set; }
    public GenderEnum? Gender { get; set; }
    public DateTime PasswordExpires { get; set; }
    public bool ChangePassword { get; set; }
    public LanguageEnum Language { get; set; }
    public int? CountryId { get; set; }
    public string Settlement { get; set; }
    public int? CityId { get; set; }
    public int? SettlementId { get; set; }
    public string Address { get; set; }
    public int? DomainId { get; set; }
    public int? RegionalOfficeId { get; set; }
    public bool? Verified { get; set; }
    public DateTime? InsertedDate { get; set; }
    public DateTime? ActivationDate { get; set; }
    public DateTime? ExpirationDate { get; set; }
}
