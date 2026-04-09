using ElasticSearchVSSQLServer.Persistence.Sql.Context;
using ElasticSearchVSSQLServer.RestApi.Configuration;
using ElasticSearchVSSQLServer.RestApi.Dependencies;
using ElasticSearchVSSQLServer.RestApi.Utils;
using ElasticSearchVSSQLServer.RestApi.Utils.Middlewares;
using Hangfire;
using Microsoft.AspNetCore.Http.HttpResults;
using Serilog;
using Serilog.Exceptions;
using Serilog.Sinks.Elasticsearch;
using System.Reflection;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddControllersWithViews();
builder.Services.AddRazorPages().AddRazorRuntimeCompilation();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.Configure<ApiConfiguration>(o => builder.Configuration.GetSection(nameof(ApiConfiguration)).Bind(o));
var config = new ApiConfiguration();

builder.Configuration.GetSection(nameof(ApiConfiguration)).Bind(config);

builder.Services.AddApiDependencies(config);

builder.Services.AddCors(p => p.AddDefaultPolicy(builder =>
{
    builder.WithOrigins(config.ClientUrl).WithExposedHeaders("x-pagination").AllowAnyMethod().AllowAnyHeader().WithExposedHeaders("Content-Disposition").AllowCredentials();
}));

configureLogging();
builder.Host.UseSerilog();

var app = builder.Build();


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.DocumentTitle = "ElasticSearchVSSQLServer";
    });
}
app.UseHttpsRedirection();
app.UseRouting();
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.UseMiddleware<SerilogEnrichUserInfoMiddleware>();
app.UseMiddleware<LogMiddleware>();

app.MapControllers();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();

void configureLogging()
{
    var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
    var configuration = new ConfigurationBuilder()
        .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true).Build();

     Serilog.Log.Logger = new LoggerConfiguration()
           .Enrich.FromLogContext()
           .Enrich.WithExceptionDetails()
           .WriteTo.Debug()
           .WriteTo.Console()
           .WriteTo.Elasticsearch(ConfigureElasticSink(configuration, environment))
           .Enrich.WithProperty("Environment", environment)
           .ReadFrom.Configuration(configuration)
           .CreateLogger();
}

ElasticsearchSinkOptions ConfigureElasticSink(IConfigurationRoot configuration, string environment)
{
    var sinkOptions = new ElasticsearchSinkOptions(new Uri(config.ElasticConfiguration.Uri))
    {
        AutoRegisterTemplate = true,
        IndexFormat = $"{Assembly.GetExecutingAssembly().GetName().Name.ToLower().Replace(".", "-")}",
        NumberOfReplicas = 1,
        NumberOfShards = 2,
        ApiKey = config.ElasticConfiguration.ApiKey
    };
    return sinkOptions;
}
