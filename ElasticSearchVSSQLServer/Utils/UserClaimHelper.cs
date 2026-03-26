namespace ElasticSearchVSSQLServer.RestApi.Utils;

using ElasticSearchVSSQLServer.Persistence.Shared;
using System.Security.Claims;

public class UserClaimHelper {
    public static string? GetUserId(ClaimsPrincipal user) {
        string? userId = user.Claims.Where(x => x.Type == ClaimTypes.NameIdentifier).Select(x => x.Value).FirstOrDefault();
        return userId;
    }

    public static string GetUserProperty(ClaimsPrincipal user, string property) {
        return ((ClaimsIdentity)user.Identity!)?.FindFirst(property)?.Value ?? string.Empty;
    }

    public static string? GetFullName(ClaimsPrincipal user) {
        string? fullname = (user.Claims.Where(x => x.Type == ClaimTypes.GivenName).Select(x => x.Value).FirstOrDefault() ?? "") + " " + (user.Claims.Where(x => x.Type == ClaimTypes.Surname).Select(x => x.Value).FirstOrDefault() ?? "");
        return fullname;
    }

    public static string[] GetRoles(ClaimsPrincipal user) {
        return ((ClaimsIdentity)user.Identity)?
               .Claims
               .Where(c => c.Type == ClaimTypes.Role)
               .ToList()
               .Select(claim => claim.Value)
               .ToArray();
    }

    public static LanguageEnum GetLanguage(ClaimsPrincipal user) {
        var userLanguage = user.Claims.FirstOrDefault(x => x.Type == ClaimTypes.Locality);
        return (LanguageEnum)int.Parse(userLanguage.Value);
    }
}
