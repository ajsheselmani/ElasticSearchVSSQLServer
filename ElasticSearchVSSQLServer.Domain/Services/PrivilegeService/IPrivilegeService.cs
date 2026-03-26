namespace ElasticSearchVSSQLServer.Domain.Services.Administration.PrivilegeService;
using System.Xml.Linq;

public interface IPrivilegeService {
    Task InitializePrivilegesAsync(List<Type> controllerTypes, XDocument doc);

    //Task<bool> AuthorizeAsync(string actionName, string roleName, string controllername, string userId);
}
