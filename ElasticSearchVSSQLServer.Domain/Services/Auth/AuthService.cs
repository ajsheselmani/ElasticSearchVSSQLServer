using AutoMapper;
using ElasticSearchVSSQLServer.Domain.Configuration;
using ElasticSearchVSSQLServer.Domain.Repositories;
using ElasticSearchVSSQLServer.Domain.Services.Subscription;
using ElasticSearchVSSQLServer.Persistence.Auth;
using ElasticSearchVSSQLServer.Persistence.Domain;
using ElasticSearchVSSQLServer.Persistence.Identity;
using ElasticSearchVSSQLServer.Persistence.Shared;
using ElasticSearchVSSQLServer.Resources;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.DirectoryServices.AccountManagement;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ElasticSearchVSSQLServer.Domain.Services.Auth
{
    public class AuthService(UserManager<ApplicationUser> userManager, IGenericRepository<DomainDTO, int> domainRepo, IOptions<JWTConfiguration> options, IOptions<DomainConfiguration> domainConfiguration, IMapper mapper, ILogger<AuthService> logger, RealtimeEventPublisher realtimeEventPublisher) : IAuthService
    {
        private readonly JWTConfiguration settings = options.Value;

        public async Task<LoginResultDto> Login(LoginDTO login)
        {
            logger.LogInformation("Tentim për kyçje. Identifikuesi: {Login}.", login.Email);

            ApplicationUser? user;
            if (login.Email.Contains("@"))
                user = await userManager.FindByEmailAsync(login.Email);
            else
                user = await userManager.FindByNameAsync(login.Email);


            if (user == null)
            {
                logger.LogWarning("Kyçja dështoi: përdoruesi nuk u gjet. Identifikuesi: {Login}.", login.Email);
                return LoginResultDto.Failure(new ErrorDTO { ErrorType = ErrorTypeEnum.Warning, Message = Resource.LoginError });
            }
            logger.LogInformation("Përdoruesi u gjet për kyçje. Email: {Email}.", user.Email);


            if (user.EmailConfirmed == false)
            {
                logger.LogWarning("Kyçja u refuzua: emaili nuk është i konfirmuar. Email: {Email}.", user.Email);
                return LoginResultDto.Failure(new ErrorDTO { ErrorType = ErrorTypeEnum.Warning, Message = Resource.EmailNotConfirmed });
            }

            if (await userManager.IsLockedOutAsync(user))
            {
                logger.LogWarning("Kyçja u refuzua: përdoruesi është i bllokuar (Lockout). Email: {Email}.", user.Email);
                return await HandleFailedLogin(user, login.Email);
            }

            if (user.DomainId.HasValue)
            {
                var domain = await domainRepo.GetByIdAsync(user.DomainId.Value);
                if (domain != null)
                {
                    try
                    {
                        logger.LogInformation("Po tentohet validimi në Domain. Domain: {DomainName}.", domain.Name);
                        using var pc = new PrincipalContext(ContextType.Domain, domain.Name);
                        var isValidUser = pc.ValidateCredentials(user.UserName, login.Password);
                        if (isValidUser)
                        {
                            logger.LogInformation("Validimi në Domain ishte i suksesshëm. Username: {Username}.", user.UserName);
                            var passwordResetToken = await userManager.GeneratePasswordResetTokenAsync(user);
                            var passwordResetResult = await userManager.ResetPasswordAsync(user, passwordResetToken, login.Password);
                        }
                        else
                        {
                            logger.LogWarning("Validimi në Domain dështoi. Username: {Username}.", user.UserName);
                            return await HandleFailedLogin(user, login.Email);
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Gabim gjatë lidhjes me Domain. DomainId: {DomainId}.", user.DomainId);
                        return LoginResultDto.Failure(new ErrorDTO { ErrorType = ErrorTypeEnum.Warning, Message = Resource.ServerNoContact });
                    }
                }
                else
                {
                    logger.LogWarning("Kyçja dështoi: Domain i pavlefshëm. DomainId: {DomainId}.", user.DomainId);
                    return LoginResultDto.Failure(new ErrorDTO { ErrorType = ErrorTypeEnum.Warning, Message = Resource.InvalidDomain });
                }
            }
            else
            {
                if (!await userManager.CheckPasswordAsync(user, login.Password))
                {
                    logger.LogWarning(
             "Kyçja dështoi: fjalëkalim i pasaktë. Email: {Email}",
            user.Email
         );
                    return await HandleFailedLogin(user, login.Email);
                }
            }

            if (user.ActivationDate > DateTime.Now && user.ExpirationDate < DateTime.Now)
            {
                logger.LogWarning(
                 "Kyçja u refuzua: jashtë intervalit të vlefshmërisë së llogarisë. UserId: {UserId}, Aktivizimi: {ActivationDate}, Skadimi: {ExpirationDate}.",
                 user.Id, user.ActivationDate, user.ExpirationDate
             );
                return LoginResultDto.Failure(new ErrorDTO
                {
                    ErrorType = ErrorTypeEnum.Warning,
                    Message = Resource.ActiveMembershipDateRequired
                });
            }
            SecurityToken token = new JwtSecurityToken();

            var authClaims = new List<Claim>
            {
                new(ClaimTypes.Name, user.UserName),
                new(ClaimTypes.GivenName, user.Firstname),
                new(ClaimTypes.Surname, user.Lastname),
                new(ClaimTypes.Name, user.UserName),
                new(ClaimTypes.Email, user.Email),
                new(ClaimTypes.NameIdentifier, user.Id),
                new(ClaimTypes.Locality, ((int)user.Language).ToString()),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            logger.LogInformation("Token po gjenerohet. UserId: {UserId}.", user.Id);
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.IssuerSigningKey));
            token = new JwtSecurityToken(
                expires: DateTime.Now.AddHours(settings.TokenExpireHour),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256));
            var changePassword = false;
            if (user.ChangePassword || user.PasswordExpires.Date <= DateTime.Now.Date)
            {
                changePassword = true;
            }

            var authenticatedUser = mapper.Map<AuthenticationUserDTO>(user);
            await userManager.ResetAccessFailedCountAsync(user);
            logger.LogInformation("Kyçja u krye me sukses. UserId: {UserId}, Email: {Email}, ChangePassword: {ChangePassword}.",
                user.Id, user.Email, changePassword);

            await realtimeEventPublisher.PublishAsync(
            eventType: RealtimeEventTypes.LoginSuccess,
            entityType: RealtimeEntityTypes.Auth,
            entityId: user.Id,
            message: "User logged in successfully"
             );

            return LoginResultDto.Success(
                new JwtSecurityTokenHandler().WriteToken(token),
                token.ValidTo,
                changePassword,
                authenticatedUser
            );
        }

        private async Task<LoginResultDto> HandleFailedLogin(ApplicationUser user, string email)
        {
            await userManager.AccessFailedAsync(user);
            await userManager.SetLockoutEnabledAsync(user, true);
            // logger.LogWarning(
            //    "Tentim i pasuksesshëm për kyçje. UserId: {UserId}, Email: {Email}",
            //    user.Id, user.Email
            //);

            if (await userManager.IsLockedOutAsync(user))
            {
                await userManager.SetLockoutEndDateAsync(user, DateTime.UtcNow.AddYears(2000));
                //     logger.LogWarning(
                //    "Përdoruesi u bllokua për shkak të tentimeve të pasuksesshme. UserId: {UserId}, Email: {Email}.",
                //    user.Id, user.Email
                //);
                //var emailTemplate = await emailConfiguration.Get((int)EmailTemplateEnum.UserBlocked);
                //var body = user.Language switch
                //{
                //    LanguageEnum.Albanian => emailTemplate.BodySq,
                //    LanguageEnum.English => emailTemplate.BodyEn,
                //    LanguageEnum.Serbian => emailTemplate.BodySr,
                //    _ => throw new ArgumentException(Resource.ErrorOccurred)
                //};

                //var subject = user.Language switch
                //{
                //    LanguageEnum.Albanian => emailTemplate.SubjectSq,
                //    LanguageEnum.English => emailTemplate.SubjectEn,
                //    LanguageEnum.Serbian => emailTemplate.SubjectSr,
                //    _ => throw new ArgumentException(Resource.ErrorOccurred)
                //};

                //var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
                //body = body.Replace("[User]", $"{user.Firstname} {user.Lastname}");
                //body = body.Replace("[reset_link]", $"{domainConfiguration.Value.ClientApplicationPath}/auth/jwt/update-password?email={Uri.EscapeDataString(email)}&token={resetToken}");

                //await emailConfiguration.SendEmailAsync(user.Email, subject, body, null);
                //logger.LogInformation("Emaili për bllokim + resetim u dërgua. UserId: {UserId}, Email: {Email}.", user.Id, user.Email);

                return LoginResultDto.Failure(new ErrorDTO
                {
                    ErrorType = ErrorTypeEnum.Warning,
                    Message = Resource.AttemptToLogin
                });
            }

            return LoginResultDto.Failure(new ErrorDTO
            {
                ErrorType = ErrorTypeEnum.Warning,
                Message = Resource.LoginError
            });
        }
    }
}
