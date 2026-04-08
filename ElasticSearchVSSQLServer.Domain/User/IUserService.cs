namespace ElasticSearchVSSQLServer.Domain.Services.User;

using Microsoft.AspNetCore.Http;
using ElasticSearchVSSQLServer.Persistence.Audit;
using ElasticSearchVSSQLServer.Persistence.Identity;
using ElasticSearchVSSQLServer.Persistence.User;

public interface IUserService {
    Task<ApplicationUser?> GetUserById(string id);
    Task<UserDto> Get(string id);
    Task<IEnumerable<UserDto>> GetAllForIndex();
    Task<UserDto> GetByIdForIndex(string id);
    Task<List<ApplicationUser>> GetAll();

    Task<UserDto> CreateUser(UserDto user, IFormFile imageFile);

    Task UpdateLanguage(int languageId, string userId); 
}
                   