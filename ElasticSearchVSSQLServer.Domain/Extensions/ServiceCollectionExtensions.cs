using ElasticSearchVSSQLServer.Domain.AutoMapper;
using ElasticSearchVSSQLServer.Domain.Configuration;
using ElasticSearchVSSQLServer.Domain.Services.Audit;
using ElasticSearchVSSQLServer.Domain.Services.Auth;
using ElasticSearchVSSQLServer.Domain.Services.SQLData;
using ElasticSearchVSSQLServer.Domain.Services.Subscription;
using ElasticSearchVSSQLServer.Domain.Services.User;
using GraphQL.Client.Http;
using GraphQL.Client.Serializer.Newtonsoft;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Domain.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDomain(this IServiceCollection services, DomainConfiguration domainConfiguration)
    {
        services.AddAutoMapper(cfg =>
        {
            cfg.AddMaps(typeof(DomainMappingConfiguration).Assembly);
        });

        AddServices(services);

        services.Configure<DomainConfiguration>(options =>
        {
            options.ClientApplicationPath = domainConfiguration.ClientApplicationPath;
        });

        services.Configure<JWTConfiguration>(options =>
        {
            options.ValidateIssuerSigningKey = domainConfiguration.JWTConfiguration.ValidateIssuerSigningKey;
            options.IssuerSigningKey = domainConfiguration.JWTConfiguration.IssuerSigningKey;
            options.ValidateIssuer = domainConfiguration.JWTConfiguration.ValidateIssuer;
            options.ValidIssuer = domainConfiguration.JWTConfiguration.ValidIssuer;
            options.ValidateAudience = domainConfiguration.JWTConfiguration.ValidateAudience;
            options.ValidAudience = domainConfiguration.JWTConfiguration.ValidAudience;
            options.RequireExpirationTime = domainConfiguration.JWTConfiguration.RequireExpirationTime;
            options.ValidateLifetime = domainConfiguration.JWTConfiguration.ValidateLifetime;
            options.TokenExpireHour = domainConfiguration.JWTConfiguration.TokenExpireHour;
        });

        services.AddSingleton(s =>
        {
            var httpClient = new HttpClient
            {
                BaseAddress = new Uri(domainConfiguration.GraphQLClientConfig.Url)
            };
            httpClient.DefaultRequestHeaders.Add("X-API-KEY", domainConfiguration.GraphQLClientConfig.ApiKey);

            return new GraphQLHttpClient(
                new GraphQLHttpClientOptions { EndPoint = new Uri(domainConfiguration.GraphQLClientConfig.Url) },
                new NewtonsoftJsonSerializer(),
                httpClient);
        });

        return services;
    }

    private static void AddServices(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ILogService, LogService>();
        services.AddScoped<RealtimeEventPublisher>();
        services.AddScoped<ISQLDataService, SQLDataService>();

    }
}