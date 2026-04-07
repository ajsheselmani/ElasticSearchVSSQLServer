namespace ElasticSearchVSSQLServer.RestApi.Utils.Middlewares;

using Serilog.Context;
using System.Security.Claims;

public class SerilogEnrichUserInfoMiddleware {

    private readonly RequestDelegate _next;

    public SerilogEnrichUserInfoMiddleware(RequestDelegate next) {
        _next = next;
    }

    public async Task Invoke(HttpContext context) {
        var user = context.User;

        var userId = UserClaimHelper.GetUserId(user);
        var role = string.Join(",", UserClaimHelper.GetRoles(user) ?? []);
        var name = UserClaimHelper.GetFullName(user);
        var email = UserClaimHelper.GetUserProperty(user, ClaimTypes.Email);

        // Enrich the log context
        using (LogContext.PushProperty("Email", email))
        using (LogContext.PushProperty("UserFullName", name))
        using (LogContext.PushProperty("UserId", userId))
        using (LogContext.PushProperty("Role", role))
        {
            await _next(context);
        }
    }
}
