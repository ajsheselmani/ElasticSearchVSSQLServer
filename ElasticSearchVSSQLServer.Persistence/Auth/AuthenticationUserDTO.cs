namespace ElasticSearchVSSQLServer.Persistence.Auth;

using ElasticSearchVSSQLServer.Persistence.Shared;

public class AuthenticationUserDTO {
    public IList<string> Authority { get; set; }

    public string? Id { get; set; }

    public string Firstname { get; set; }

    public string Lastname { get; set; }

    public string Email { get; set; }

    public string Username { get; set; }

    public LanguageEnum Language { get; set; }
}
