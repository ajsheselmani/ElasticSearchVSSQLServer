using AutoMapper;
using ElasticSearchVSSQLServer.Domain.Services.Auth;
using ElasticSearchVSSQLServer.Persistence.Auth;
using ElasticSearchVSSQLServer.Persistence.Shared;
using ElasticSearchVSSQLServer.Persistence.Sql.Context;
using ElasticSearchVSSQLServer.Resources;
using ElasticSearchVSSQLServer.RestApi.Models.InputModels;
using ElasticSearchVSSQLServer.RestApi.Utils;
using ElasticSearchVSSQLServer.RestApi.Utils.General;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ElasticSearchVSSQLServer.RestApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController(IAuthService authService, IMapper mapper, ILogger<AuthController> logger) : ControllerBase
    {
        /// <summary>
        /// Handles user login by validating credentials and returning authentication details.
        /// </summary>
        /// <param name="login">The login credentials, including email and password.</param>
        /// <returns>An HTTP 200 response with authentication details (e.g., token, user info) if successful.</returns>

        [HttpPost, AllowAnonymous, LogBodyResponse]
        public async Task<IActionResult> Post(LoginInputModel login)
        {
            if (!ModelState.IsValid)
            {
                logger.LogWarning("Login request validation failed.");
                return ValidationProblem(ModelState);
            }
            var mappedLogin = mapper.Map<LoginDTO>(login);
            var loginResult = await authService.Login(mappedLogin);
            return Ok(loginResult);
        }

        /// <summary>
        /// Logs that the current user has successfully signed out.
        /// (No session/token invalidation is done here.)
        /// </summary>
        [HttpPost("Logout")]
        [AllowAnonymous]
        public IActionResult Logout([FromQuery] string userId)
        {
            logger.LogInformation("User successfully logged out. UserId: {UserId}", userId);

            return Ok();
        }
    }
}
