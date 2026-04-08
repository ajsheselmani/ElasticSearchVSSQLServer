
namespace ElasticSearchVSSQLServer.Domain.Services.User;

using global::AutoMapper;
using GraphQL;
using GraphQL.Client.Http;
using HtmlAgilityPack;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using PuppeteerSharp;
using PuppeteerSharp.Media;
using ElasticSearchVSSQLServer.Domain;
using ElasticSearchVSSQLServer.Domain.Configuration;
using ElasticSearchVSSQLServer.Domain.Repositories;
using ElasticSearchVSSQLServer.Domain.Services.Subscription;
using ElasticSearchVSSQLServer.Persistence.Audit;
using ElasticSearchVSSQLServer.Persistence.Identity;
using ElasticSearchVSSQLServer.Persistence.Shared;
using ElasticSearchVSSQLServer.Persistence.User;
using ElasticSearchVSSQLServer.Resources;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

public class UserService(UserManager<ApplicationUser> userManager, IGenericRepository<UserDto, string> userRepo, IOptions<DomainConfiguration> domainConfiguration, IMapper mapper, ILogger<UserService> logger, GraphQLHttpClient client, RealtimeEventPublisher realtimeEventPublisher) : IUserService
{

    public async Task<ApplicationUser?> GetUserById(string id)
    {
        var user = await userManager.FindByIdAsync(id);
        var userName = user.UserName;
        logger.LogInformation("Kërkesë për marrjen e user {userName}", userName);
        logger.LogInformation("Marrja e user përfundoi. User: {userName}, U gjet: {Ugjet}", userName, user != null);
        return user;
    }


    public async Task<UserDto> Get(string id)
    {
        var user = await userManager.FindByIdAsync(id);
        var userName = user.UserName;
        logger.LogInformation("Kërkesë për detajet e user. UserId: {userName}", userName);
        var mappedUser = mapper.Map<UserDto>(user);
       
        logger.LogInformation("Detajet e user u kthyen me sukses. User: {userName}", userName);
        return mappedUser;
    }

    public async Task<List<ApplicationUser>> GetAll()
    {
        logger.LogInformation("Kërkesë për marrjen e të gjithë përdoruesve");
        var users = userManager.Users.ToList();
        logger.LogInformation("U kthyen {Count} përdorues", users?.Count ?? 0);
        return users;
    }
    public async Task<IEnumerable<UserDto>> GetAllForIndex()
    {
        var users = await userRepo.GetByConditionAsync(x => true);

        return users;
    }

    public async Task<UserDto?> GetByIdForIndex(string id)
    {
        var user = await userRepo.GetByIdAsync(id);
        return user;
    }
    public async Task<UserDto> CreateUser(UserDto user, IFormFile imageFile)
    {
        var birthdateString = user.Birthdate?.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture) ?? "";
        
        var applicationUser = mapper.Map<ApplicationUser>(user);
        

        var listOfUsers = userManager.Users.ToList();
        var samePersonalNumber = listOfUsers.Where(x => x.PersonalNumber == user.PersonalNumber).Any();
        if (samePersonalNumber)
        {
            logger.LogWarning("Krijimi dështoi: PersonalNumber ekziston. PersonalNumber: {PersonalNumber}", user.PersonalNumber);
            throw new Exception(Resource.personalNumberExists);
        }

        if (string.IsNullOrEmpty(user.Password))
        {
            user.Password = Generate(8);
            logger.LogInformation("Password u gjenerua automatikisht. Email: {Email}", user.Email);
        }

        var result = await userManager.CreateAsync(applicationUser, user.Password);
        if (!result.Succeeded)
        {
            logger.LogError("Gabim gjatë insertimit të përdoruesit - {0}",
                string.Join(", ", result.Errors.Select(x => x.Description).ToArray()));
            throw new Exception(string.Join(", ", result.Errors.Select(x => x.Description).ToArray()));
        }

        logger.LogInformation("Përdoruesi {0} është regjistruar me sukses.", user.Email);

        await realtimeEventPublisher.PublishAsync(
            eventType: RealtimeEventTypes.UserCreated,
            entityType: RealtimeEntityTypes.User,
            entityId: applicationUser.Id,
            message: $"User {user.Email} created successfully"
        );

        return mapper.Map<UserDto>(applicationUser);
    }

    public async Task UpdateLanguage(int languageId, string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        var userName = user.UserName;
        logger.LogInformation("Ndryshimi i gjuhës u nis. User: {userName}, LanguageId: {LanguageId}", userName, languageId);
        user.Language = (LanguageEnum)languageId;
       
        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            logger.LogError("Ndryshimi i gjuhës dështoi. User: {userName}. Errors: {Errors}", userName, string.Join(", ", result.Errors.Select(x => x.Description)));
            throw new Exception(string.Join(", ", result.Errors.Select(x => x.Description)));
        }
        logger.LogInformation("Ndryshimi i gjuhës përfundoi me sukses. User: {userName}", userName);

    }

    public static string Generate(int length = 12)
    {
        string AllowedChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        var result = new char[length];
        using var rng = RandomNumberGenerator.Create();
        byte[] buffer = new byte[length];

        rng.GetBytes(buffer);
        for (int i = 0; i < length; i++)
        {
            result[i] = AllowedChars[buffer[i] % AllowedChars.Length];
        }
        return new string(result);
    }
}