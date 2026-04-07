namespace ElasticSearchVSSQLServer.Domain.Services.Administration.PrivilegeService;

using ElasticSearchVSSQLServer.Domain.Repositories;
using ElasticSearchVSSQLServer.Persistence.Controller;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Reflection;
using System.Threading.Tasks;
using System.Xml.Linq;

public class PrivilegeService(IControllerRepository controllerRepo, IGenericRepository<ActionDTO, int> actionRepo/*, IRoleAccessRepository roleAccessRepository*/) : IPrivilegeService {

    private int maxActionId = 0;

    public async Task InitializePrivilegesAsync(List<Type> controllerTypes, XDocument doc) {
        var controllers = await controllerRepo.GetAllAsync();
        var actions = await actionRepo.GetAllAsync();
        var maxId = controllers.Select(c => c.ControllerId).DefaultIfEmpty().Max() + 1;
        maxActionId = actions.Select(c => c.ActionId).DefaultIfEmpty().Max() + 1;

        List<ControllerDTO> newControllers = [];
        List<ActionDTO> newActions = [];

        foreach (var type in controllerTypes)
        {
            var existingController = controllers.FirstOrDefault(c => c.Name == type.Name);
            if (existingController == null)
            {
                var addController = CreateController(type, doc);
                addController.ControllerId = maxId++;
                newControllers.Add(addController);
            }
            else
            {
                existingController.Active = true;
                UpdateActions(existingController, type, doc, newActions);
            }
        }

        foreach (var controller in newControllers)
            await controllerRepo.AddAsync(controller);

        foreach (var action in newActions)
        {
            action.ActionId = maxActionId++;
            await actionRepo.AddAsync(action);
        }

        controllers = await controllerRepo.GetAllAsync();
        actions = await actionRepo.GetAllAsync();

        await DeactiveOldControllersAndActions(controllers, actions, controllerTypes);
    }

    private ControllerDTO CreateController(Type controllerType, XDocument doc) {
        return new ControllerDTO
        {
            Name = controllerType.Name,
            Active = true,
            Actions = controllerType.GetMethods(BindingFlags.Instance | BindingFlags.DeclaredOnly | BindingFlags.Public)
                .Where(c => !c.GetCustomAttributes(typeof(System.Runtime.CompilerServices.CompilerGeneratedAttribute), true).Any())
                .Select(c => new ActionDTO
                {
                    ActionId = maxActionId++,
                    Active = true,
                    Name = c.Name,
                    Type = GetHttpMethod(c),
                    Description = getMethodDescription(doc, controllerType.Name, c.Name)
                }).ToList()
        };
    }

    private void UpdateActions(ControllerDTO controller, Type controllerType, XDocument doc, List<ActionDTO> newActions) {
        foreach (var method in controllerType.GetMethods(BindingFlags.Instance | BindingFlags.DeclaredOnly | BindingFlags.Public)
                    .Where(m => !m.GetCustomAttributes(typeof(System.Runtime.CompilerServices.CompilerGeneratedAttribute), true).Any()))
        {
            var existingAction = controller.Actions.FirstOrDefault(a => a.Name == method.Name);
            if (existingAction == null)
            {
                newActions.Add(new ActionDTO
                {
                    ActionId = maxActionId++,
                    ControllerId = controller.ControllerId,
                    Active = true,
                    Name = method.Name,
                    Type = GetHttpMethod(method),
                    Description = getMethodDescription(doc, controller.Name, method.Name)
                });
            }
            else
            {
                existingAction.Active = true;
                existingAction.Description = getMethodDescription(doc, controller.Name, method.Name);
            }
        }
    }

    private string getMethodDescription(XDocument doc, string controller, string method) {
        var result = doc.Descendants("member")
                        .Where(m => m.Attribute("name").Value.Contains(controller) &&
                                    m.Attribute("name").Value.Contains(method))
                        .Select(m => m.Element("summary")?.Value).FirstOrDefault();
        return result;
    }

    private string GetHttpMethod(MethodInfo method)
    {
        foreach (var attr in method.GetCustomAttributes())
        {
            var name = attr.GetType().Name;

            if (name == "HttpGetAttribute") return "GET";
            if (name == "HttpPostAttribute") return "POST";
            if (name == "HttpPutAttribute") return "PUT";
            if (name == "HttpDeleteAttribute") return "DELETE";
            if (name == "HttpPatchAttribute") return "PATCH";
        }

        return "UNKNOWN";
    }

    //private string GetHttpMethod(MethodInfo method) {
    //    if (method.GetCustomAttribute<HttpGetAttribute>() != null) return "GET";
    //    if (method.GetCustomAttribute<HttpPostAttribute>() != null) return "POST";
    //    if (method.GetCustomAttribute<HttpPutAttribute>() != null) return "PUT";
    //    if (method.GetCustomAttribute<HttpDeleteAttribute>() != null) return "DELETE";
    //    if (method.GetCustomAttribute<HttpPatchAttribute>() != null) return "PATCH";
    //    return "UNKNOWN";
    //}

    private DescriptionAttribute GetDescriptionAttribute(MethodInfo method) => method.GetCustomAttribute<DescriptionAttribute>();

    private async Task DeactiveOldControllersAndActions(IEnumerable<ControllerDTO> controllers, IEnumerable<ActionDTO> actions, List<Type> controllerTypes) {
        foreach (var controller in controllers)
        {
            var controllerType = controllerTypes.FirstOrDefault(ct => ct.Name == controller.Name);
            if (controllerType == null)
                continue;
            var currentMethods = controllerType.GetMethods(BindingFlags.Instance | BindingFlags.DeclaredOnly | BindingFlags.Public).Where(m => !m.GetCustomAttributes(typeof(System.Runtime.CompilerServices.CompilerGeneratedAttribute), true).Any());

            foreach (var action in controller.Actions)
            {
                var methodsExists = currentMethods.Any(m => m.Name == action.Name);
                if (!methodsExists)
                {
                    action.Active = false;
                    await actionRepo.UpdateAsync(action.ActionId, action);
                }
                else
                {
                    var existingController = controllers.Where(x => x.ControllerId == controller.ControllerId).FirstOrDefault();
                    if (existingController != null)
                    {
                        action.Active = true;
                        await actionRepo.UpdateAsync(action.ActionId, action);
                    }
                }
            }
        }
    }
}
