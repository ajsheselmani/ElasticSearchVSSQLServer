namespace ElasticSearchVSSQLServer.Persistence.Auth;

using ElasticSearchVSSQLServer.Persistence.Shared;

public class LoginResultDto {
    public string? Token { get; set; }

    public DateTime? Expiration { get; set; }

    public bool ChangePassword { get; set; }

    public bool IsBadRequest { get; set; }
    public bool IsUnauthorized { get; set; }
    public string Message { get; set; }
    public ErrorDTO? Error { get; set; }
    public bool TwoFAEnabled { get; set; }
    public AuthenticationUserDTO User { get; set; }

    public static LoginResultDto Success(string token, DateTime expiration, bool changePassword, AuthenticationUserDTO AuthenticationUser, bool TwoFAEnabled) {
        return new LoginResultDto
        {
            Token = token,
            Expiration = expiration,
            ChangePassword = changePassword,
            Error = null,
            TwoFAEnabled= TwoFAEnabled,
            User = AuthenticationUser
        };
    }

    public static LoginResultDto Failure(ErrorDTO error) {
        return new LoginResultDto
        {
            Error = error,
        };
    }

    public static LoginResultDto MustChangePassword(bool changePassword) {
        return new LoginResultDto
        {
            ChangePassword = changePassword,
        };
    }
}
