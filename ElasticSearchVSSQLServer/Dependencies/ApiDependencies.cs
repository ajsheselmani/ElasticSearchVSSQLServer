namespace ElasticSearchVSSQLServer.RestApi.Dependencies;

using ElasticSearchVSSQLServer.Domain.Configuration;
using ElasticSearchVSSQLServer.Domain.Extensions;
using ElasticSearchVSSQLServer.Indexing.Extensions;
using ElasticSearchVSSQLServer.Persistence.Sql.Context;
using ElasticSearchVSSQLServer.Persistence.Sql.Extensions;
using ElasticSearchVSSQLServer.RestApi.AutoMapper;
using ElasticSearchVSSQLServer.RestApi.Configuration;
using ElasticSearchVSSQLServer.RestApi.Utils.General;
using GraphQL;
using HotChocolate.AspNetCore;
using HotChocolate.Execution.Configuration;
using HotChocolate.Types;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System;
using System.Linq;
using System.Text;

public static class ApiDependencies
    {
        public static IServiceCollection AddApiDependencies(this IServiceCollection services, ApiConfiguration configuration)
        {
            services.AddIndexing(configuration.ElasticConfiguration);

        services.AddAutoMapper(cfg =>
        {
            cfg.AddMaps(typeof(InputMappings).Assembly);
        });

        services.AddSqlPersistence(configuration.DatabaseConfiguration);

            services.AddDomain(configuration.DomainConfiguration);

            services.AddMemoryCache();

            services.AddAuthentication(configuration.DomainConfiguration.JWTConfiguration);
            services.AddHttpContextAccessor();
            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();

            services.AddSwagger();
        services.ConfigureGraphQL();

        return services;
        }

        private static void AddAuthentication(this IServiceCollection services, JWTConfiguration configuration)
        {
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(options =>
            {
                options.SaveToken = true;
                options.RequireHttpsMetadata = false;
                options.TokenValidationParameters = new TokenValidationParameters()
                {
                    ValidateIssuerSigningKey = configuration.ValidateIssuerSigningKey,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration.IssuerSigningKey)),
                    ValidateIssuer = configuration.ValidateIssuer,
                    ValidAudience = configuration.ValidAudience,
                    ValidIssuer = configuration.ValidIssuer,
                    ValidateAudience = configuration.ValidateAudience,
                    RequireExpirationTime = configuration.RequireExpirationTime,
                    ValidateLifetime = configuration.ValidateLifetime,
                    ClockSkew = TimeSpan.Zero
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        var availableHubs = new[] { "/chatHub", "/notificationHub" };

                        if (!string.IsNullOrEmpty(accessToken) &&
                            availableHubs.Any(p => path.StartsWithSegments(p)))
                        {
                            context.Token = accessToken;
                        }

                        return Task.CompletedTask;
                    }
                };
            });
        }

        private static void AddSwagger(this IServiceCollection services)
        {
            services.AddEndpointsApiExplorer();

            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "ElasticSearchVSSQLServer API",
                    Version = "v1"
                });

                c.AddSecurityDefinition("bearer", new OpenApiSecurityScheme
                {
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    Description = "JWT Authorization header using the Bearer scheme. \r\n\r\n Do not inlcude \"Bearer\", Swagger adds it automatically.\r\n\r\nExample: \"token\"",
                    In = ParameterLocation.Header,
                    Name = "Authorization"
                });

                c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
                {
                    [new OpenApiSecuritySchemeReference("bearer", document)] = []
                });

                try
                {
                    var xmlPath = System.IO.Path.Combine(AppContext.BaseDirectory, "ElasticSearchVSSQLServer.RestApi.xml");
                    if (System.IO.File.Exists(xmlPath))
                    {
                        c.IncludeXmlComments(xmlPath);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Warning: Could not load XML comments file: {ex.Message}");
                }
            });
        }

        private static IRequestExecutorBuilder AddAllDeclaredObjectTypesFromAssembly(
            this IRequestExecutorBuilder schemaBuilder, Type[] assemblyTypes)
        {
            var objectTypes = assemblyTypes
                .Where(type =>
                    type.IsClass &&
                    !type.IsAbstract &&
                    typeof(ObjectType).IsAssignableFrom(type))
                .ToList();

            foreach (var objectType in objectTypes)
            {
                schemaBuilder.AddType(objectType);
            }

            return schemaBuilder;
        }

    private static void ConfigureGraphQL(this IServiceCollection services)
    {
        var currentAssembly = typeof(ApiDependencies).Assembly;
        var assemblyTypes = currentAssembly.GetTypes();

        services
            .AddGraphQLServer()
            .RegisterService<ApplicationDBService>()
            .AddAuthorization()
            .BindRuntimeType<char, StringType>()
            .AddInMemorySubscriptions()
            .AddAllDeclaredObjectTypesFromAssembly(assemblyTypes)
            .SetPagingOptions(
                 new HotChocolate.Types.Pagination.PagingOptions
                 {
                     MaxPageSize = int.MaxValue,
                     DefaultPageSize = int.MaxValue - 1,
                     IncludeTotalCount = true,
                 }
             )
            .AddProjections()
            .AddFiltering()
            .AddSorting()
            .ModifyRequestOptions(opt =>
            {
                opt.IncludeExceptionDetails = false;
                opt.ExecutionTimeout = TimeSpan.FromSeconds(30);
            });
    }
}