using ElasticSearchVSSQLServer.Domain.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Domain.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDomain(this IServiceCollection services, DomainConfiguration domainConfiguration)
    {
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
        return services;
    }

    private static void AddServices(this IServiceCollection services)
    {

    }
}