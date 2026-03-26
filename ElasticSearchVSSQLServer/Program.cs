using ElasticSearchVSSQLServer.Persistence.Sql.Context;
using ElasticSearchVSSQLServer.RestApi.Configuration;
using ElasticSearchVSSQLServer.RestApi.Dependencies;
using ElasticSearchVSSQLServer.RestApi.Utils;
using ElasticSearchVSSQLServer.RestApi.Utils.Middlewares;
using Microsoft.AspNetCore.Http.HttpResults;
using Serilog.Sinks.Elasticsearch;
using System.Reflection;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateSlimBuilder(args);

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

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.DocumentTitle = "ElasticSearchVSSQLServer";
    });
}

app.UseMiddleware<LogMiddleware>();
app.UseCors();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();

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
