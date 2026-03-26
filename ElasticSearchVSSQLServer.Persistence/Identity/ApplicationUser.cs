namespace ElasticSearchVSSQLServer.Persistence.Identity;

using ElasticSearchVSSQLServer.Persistence.Shared;
using Microsoft.AspNetCore.Identity;

public class ApplicationUser: IdentityUser {
    public string Firstname { get; set; }

    public string Lastname { get; set; }

    public string PersonalNumber { get; set; }

    public DateTime? Birthdate { get; set; }

    public GenderEnum? Gender { get; set; }

    public DateTime PasswordExpires { get; set; }

    public bool ChangePassword { get; set; }

    public LanguageEnum Language { get; set; }

    public int? DomainId { get; set; }

    public string? ImageProfile { get; set; }

    public DateTime? ActivationDate { get; set; }

    public DateTime? ExpirationDate { get; set; }

    public string InsertedFrom { get; set; }

    public DateTime? InsertedDate { get; set; }

    public string? UpdatedFrom { get; set; }

    public DateTime? UpdatedDate { get; set; }
}
