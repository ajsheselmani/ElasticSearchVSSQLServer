namespace ElasticSearchVSSQLServer.RestApi.Utils.General;

using ElasticSearchVSSQLServer.Domain.Services.Administration.PrivilegeService;
using Microsoft.AspNetCore.Mvc;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using System.Xml.Linq;

public class InitializePrivilegeService : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger _logger;

    public InitializePrivilegeService(IServiceProvider serviceProvider, ILoggerFactory logger)
    {
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
        _logger = (logger ?? throw new ArgumentNullException(nameof(logger))).CreateLogger<InitializePrivilegeService>();
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation($"Fillimi i leximit te metodave dhe kontrollerave ne aplikacion - {DateTime.Now}");

        using var scope = _serviceProvider.CreateScope();

        var asm = Assembly.GetEntryAssembly() ?? Assembly.GetExecutingAssembly();
        var controllerTypes = asm?.GetTypes().Where(type => typeof(ControllerBase).IsAssignableFrom(type)).ToList()
                              ?? new List<Type>();

        var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var basePath = System.IO.Path.Combine(AppContext.BaseDirectory, xmlFilename);

        XDocument doc;
        if (System.IO.File.Exists(basePath))
        {
            try
            {
                doc = XDocument.Load(basePath);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load XML comments file '{path}'. Proceeding with empty document.", basePath);
                doc = new XDocument(new XElement("root"));
            }
        }
        else
        {
            _logger.LogWarning("XML comments file not found at {path}. Proceeding with empty document.", basePath);
            doc = new XDocument(new XElement("root"));
        }

        var privilegeService = scope.ServiceProvider.GetService<IPrivilegeService>();
        if (privilegeService == null)
        {
            _logger.LogWarning("IPrivilegeService is not registered in DI. Skipping privilege initialization.");
            return;
        }

        await privilegeService.InitializePrivilegesAsync(controllerTypes, doc);
        _logger.LogInformation($"Ka përfunduar pjesa e leximit te metodave dhe kontrollerave ne aplikacion - {DateTime.Now}");
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
