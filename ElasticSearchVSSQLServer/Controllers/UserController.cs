using AutoMapper;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Options;
using ElasticSearchVSSQLServer.Domain.Configuration;
using ElasticSearchVSSQLServer.Domain.Services.User;
using ElasticSearchVSSQLServer.Indexing.Models;
using ElasticSearchVSSQLServer.Indexing.Services;
using ElasticSearchVSSQLServer.Persistence.Identity;
using ElasticSearchVSSQLServer.Persistence.Shared;
using ElasticSearchVSSQLServer.Persistence.User;
using ElasticSearchVSSQLServer.Resources;
using ElasticSearchVSSQLServer.RestApi.Models.InputModels.User;
using ElasticSearchVSSQLServer.RestApi.Models.OutputModels.User;
using ElasticSearchVSSQLServer.RestApi.Utils;
using System.Security.AccessControl;

namespace RBO.RestApi.Areas.Administration.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class UserController(IMapper mapper, IUserService service, IIndexService indexService, ILogger<UserController> logger, IConfiguration configuration, IServiceScopeFactory _serviceScopeFactory, UserManager<ApplicationUser> userManager) : ControllerBase
{

    private readonly IConfiguration _configuration = configuration; 
    private readonly UserManager<ApplicationUser> _userManager = userManager;

    /// <summary>
    /// Creates a new user.
    /// </summary>
    /// <param name="inputModel">The input model containing the user data.</param>
    /// <returns>The result of the user creation operation.</returns>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Post([FromForm] UserInputModel inputModel)
    {
        var userId = UserClaimHelper.GetUserId(User);
        var userName = UserClaimHelper.GetFullName(User);
        var dataToInsert = mapper.Map<UserDto>(inputModel);
        try
        {
            var result = await service.CreateUser(dataToInsert, inputModel.imageFile);
            logger.LogInformation("Krijimi i nje perdoruesi te ri nga {userName} u krye me sukses.", userName);
            return Ok(mapper.Map<UserOutputModel>(result));
        }
        catch (Exception ex)
        {
            logger.LogError("Deshtoi krijimi i perdoruesit te ri nga {userName}", userName);
            return BadRequest(new ErrorDTO { ErrorType = ErrorTypeEnum.Error, Message = ex.Message });
        }
    }

    /// <summary>
    /// Creates a new user.
    /// </summary>
    /// <param name="inputModel">The input model containing the user data.</param>
    /// <returns>The result of the user creation operation.</returns>
    [HttpPost("RegisterNewUser")]
    public async Task<IActionResult> RegisterNewUser([FromForm] RegisterUserModel inputModel)
    {
        var userId = UserClaimHelper.GetUserId(User);
        var userName = UserClaimHelper.GetFullName(User);
        var dataToInsert = mapper.Map<UserDto>(inputModel);

        try
        {
            var imageProfile = inputModel.ImageProfile;

            var result = await service.CreateUser(dataToInsert, imageProfile);

            logger.LogInformation("Krijimi i nje perdoruesi te ri nga {userName} u krye me sukses.", userName);
            return Ok(mapper.Map<UserOutputModel>(result));
        }
        catch (Exception ex)
        {
            logger.LogError("Deshtoi krijimi i perdoruesit te ri nga {userName}: {ErrorMessage}", userName, ex.Message);
            return BadRequest(new ErrorDTO { ErrorType = ErrorTypeEnum.Error, Message = ex.Message });
        }
    }

    /// <summary>
    /// Retrieves a list of user with a specific user ID.
    /// </summary>
    /// <param name="id">The ID of the user for which user are being retrieved.</param>
    /// <returns>A list of user associated with the specified user ID.</returns>
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var userId = UserClaimHelper.GetUserId(User);
        var userName = UserClaimHelper.GetFullName(User);
        var user = await service.GetUserById(id);
        logger.LogInformation("Marrja e perdoruesit nga {userName} u krye me sukses.", userName);
        return Ok(user);
    }

    /// <summary>
    /// Retrieves the profile image for a user with the specified ID.
    /// </summary>
    /// <param name="id">The ID of the user whose profile image is being retrieved.</param>
    /// <returns>The base64-encoded profile image if found; otherwise, a not found response.</returns>
    [HttpGet("GetProfileImage")]
    public async Task<IActionResult> GetProfileImage(string id)
    {
        var userId = UserClaimHelper.GetUserId(User);
        var userName = UserClaimHelper.GetFullName(User);

        var user = await service.GetUserById(id);

        if (user == null || string.IsNullOrEmpty(user.ImageProfile))
            return NotFound(Resource.UserOrProfileImageNotFound);

        var filePath = System.IO.Path.Combine(_configuration["ApiConfiguration:DomainConfiguration:DocumentSettings:Path"], user.ImageProfile);

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(Resource.ProfileImageNotFound);
        }

        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);

        logger.LogInformation("Marrja e fotos se profilit per perdorues nga {userName} u krye me sukses.", userName);
        return Ok(Convert.ToBase64String(fileBytes));
    }

    ///<summary>
    ///Retrieves the profile of the currently logged-in user.
    ///</summary>
    ///<returns>Returns the profile data for the logged-in user.</returns>
    [HttpGet("CurrentUser")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = UserClaimHelper.GetUserId(User);
        var user = await service.Get(userId);
        var result = mapper.Map<CurrentUserOutputModel>(user);
        return Ok(result);

    }

    /// <summary>
    /// To change language in the system for the logged user
    /// </summary>
    /// <param name="languageId">LanguageId that has to be set</param>
    /// <returns>Returns OK or ErrorVM object </returns>
    [HttpPut("UpdateUserLanguage")]
    public async Task<IActionResult> UpdateUserLanguage(int languageId)
    {
        var userId = UserClaimHelper.GetUserId(User);
        var userName = UserClaimHelper.GetFullName(User);

        if (languageId < 1 || languageId > 3)
        {
            logger.LogWarning("Perditesimi i gjuhes ne {LanguageId} per perdoruesin: {userName} deshtoi.", languageId, userName);
            return BadRequest(new ErrorDTO { ErrorType = ErrorTypeEnum.Info, Message = Resource.infoLanguageLimit });
        }

        try
        {
            await service.UpdateLanguage(languageId, UserClaimHelper.GetUserId(User));
            logger.LogInformation("Perditesimi i gjuhes ne {LanguageId} per perdoruesin: {userName} u krye me sukses.", languageId, userName);
            return Ok();
        }
        catch (Exception ex)
        {
            logger.LogError("Perditesimi i gjuhes ne {LanguageId} per perdoruesin: {UserId} deshtoi. ex: " + ex.Message, languageId, userId);
            return BadRequest(new ErrorDTO { ErrorType = ErrorTypeEnum.Error, Message = ex.Message });
        }
    }
}
