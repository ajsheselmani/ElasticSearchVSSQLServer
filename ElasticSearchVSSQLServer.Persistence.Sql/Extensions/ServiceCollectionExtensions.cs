namespace ElasticSearchVSSQLServer.Persistence.Sql.Extensions;

using ElasticSearchVSSQLServer.Domain.Repositories;
using ElasticSearchVSSQLServer.Persistence.Identity;
using ElasticSearchVSSQLServer.Persistence.Sql.Configuration;
using ElasticSearchVSSQLServer.Persistence.Sql.Context;
using ElasticSearchVSSQLServer.Persistence.Sql.Identity;
using ElasticSearchVSSQLServer.Persistence.Sql.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;


    public static class ServiceCollectionExtensions {
        public static IServiceCollection AddSqlPersistence(this IServiceCollection services, DatabaseConfiguration databaseConfiguration)
        {
            services.AddRepositorySupport();

            services.AddPooledDbContextFactory<ApplicationDbContext>(options =>
            {
                options.EnableSensitiveDataLogging();
                options.UseSqlServer(databaseConfiguration.ConnectionString);
            });

            services.AddDbContextPool<IdentityContext>(options =>
            {
                options.UseSqlServer(databaseConfiguration.ConnectionString);
            });

            services.AddIdentitySupport(databaseConfiguration.SecurityConfig);

            return services;
        }

    private static void AddIdentitySupport(this IServiceCollection services, SecurityConfig configuration)
        => services.AddIdentityCore<ApplicationUser>(options =>
        {
            options.Password.RequireLowercase = configuration.RequireLowercase;
            options.Password.RequireNonAlphanumeric = configuration.RequireNonAlphanumeric;
            options.Password.RequireUppercase = configuration.RequireUppercase;
            options.Password.RequireDigit = configuration.RequireDigit;
            options.Password.RequiredLength = configuration.RequiredLength;
            options.SignIn.RequireConfirmedEmail = configuration.RequireConfirmedEmail;
            options.SignIn.RequireConfirmedAccount = configuration.RequireConfirmedAccount;
            options.Lockout.MaxFailedAccessAttempts = configuration.MaxFailedAccessAttempts;
        });
        //.AddRoles<ApplicationRole>().AddEntityFrameworkStores<IdentityContext>().AddDefaultTokenProviders();

        private static void AddRepositorySupport(this IServiceCollection services)
        {
            services.TryAddTransient<ApplicationDBService>();
        }

        private static void SyncTestDatabase(this IServiceCollection services, DatabaseConfiguration databaseConfiguration)
        {
            string exportFile = Path.Combine(Path.GetTempPath(), "db.bacpac");
            RunSqlPackage($"/Action:Export /SourceConnectionString:\"{databaseConfiguration.ConnectionStringTesting}\" /TargetFile:\"{exportFile}\"");
            RunSqlPackage($"/Action:Import /SourceFile:\"{exportFile}\" /TargetConnectionString:\"{databaseConfiguration.ConnectionString}\"");
        }

        private static void RunSqlPackage(string arguments)
        {
            var process = new Process();
            process.StartInfo.FileName = "SqlPackage.exe";
            process.StartInfo.Arguments = arguments;
            process.StartInfo.UseShellExecute = false;
            process.StartInfo.RedirectStandardOutput = true;
            process.StartInfo.RedirectStandardError = true;

            process.Start();

            string output = process.StandardOutput.ReadToEnd();
            string error = process.StandardError.ReadToEnd();

            process.WaitForExit();

            if (process.ExitCode != 0)
                throw new Exception($"SqlPackage failed:\n{error}");
            else
                Console.WriteLine(output);
        }
    }
