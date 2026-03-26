namespace ElasticSearchVSSQLServer.RestApi.Utils.General;

using ElasticSearchVSSQLServer.Domain.Services.Administration.PrivilegeService;
using Microsoft.AspNetCore.Mvc;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using System.Xml.Linq;

public class InitializePrivilegeService(IServiceProvider serviceProvider, ILoggerFactory logger) : IHostedService {

    private readonly ILogger _logger = logger.CreateLogger<InitializePrivilegeService>();

    public async Task StartAsync(CancellationToken cancellationToken) {
        _logger.LogInformation($"Fillimi i leximit te metodave dhe kontrollerave ne aplikacion - {DateTime.Now}");

        using var scope = serviceProvider.CreateScope();

        var asm = Assembly.GetEntryAssembly();
        var controllerTypes = asm.GetTypes().Where(type => typeof(ControllerBase).IsAssignableFrom(type)).ToList();

        var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var basePath = System.IO.Path.Combine(AppContext.BaseDirectory, xmlFilename);
        XDocument doc = XDocument.Load(basePath);
        var privilegeService = scope.ServiceProvider.GetService<IPrivilegeService>();
        await privilegeService.InitializePrivilegesAsync(controllerTypes, doc);
        _logger.LogInformation($"Ka përfunduar pjesa e leximit te metodave dhe kontrollerave ne aplikacion - {DateTime.Now}");
    }

    public Task StopAsync(CancellationToken cancellationToken) {
        return Task.CompletedTask;
    }
}
