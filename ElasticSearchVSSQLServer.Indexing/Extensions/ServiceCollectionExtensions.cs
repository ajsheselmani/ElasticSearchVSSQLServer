using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.Serialization;
using Elastic.Transport;
using ElasticSearchVSSQLServer.Indexing.AutoMapper;
using ElasticSearchVSSQLServer.Indexing.Configuration;
using ElasticSearchVSSQLServer.Indexing.Services;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace ElasticSearchVSSQLServer.Indexing.Extensions;
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddIndexing(this IServiceCollection serviceCollection, ElasticConfiguration configuration)
    {
        serviceCollection.AddSingleton(configuration);
        serviceCollection.AddAutoMapper(cfg =>
        {
            cfg.AddMaps(typeof(IndexMappingConfiguration).Assembly);
        });

        serviceCollection.Configure<ElasticConfiguration>(options =>
        {
            options.Uri = configuration.Uri;
            options.Index = configuration.Index;
            options.CertificateFingerprint = configuration.CertificateFingerprint;
            options.Password = configuration.Password;
            options.Username = configuration.Username;
        });

        var nodePool = new SingleNodePool(new Uri(configuration.Uri));

        var settings = new ElasticsearchClientSettings(
                nodePool,
                sourceSerializer: (defaultSerializer, settings) =>
                    new DefaultSourceSerializer(settings, opt =>
                        opt.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                    )
            )
            .CertificateFingerprint(configuration.CertificateFingerprint);

        if (!string.IsNullOrWhiteSpace(configuration.ApiKey))
        {
            settings = settings.Authentication(new ApiKey(configuration.ApiKey));
        }
        else if (!string.IsNullOrWhiteSpace(configuration.Username) && !string.IsNullOrWhiteSpace(configuration.Password))
        {
            settings = settings.Authentication(new BasicAuthentication(configuration.Username, configuration.Password));
        }

        serviceCollection.AddSingleton(new ElasticsearchClient(settings));

        serviceCollection.AddScoped<IIndexService, IndexService>();
        serviceCollection.AddScoped<IElasticDataIndexService, ElasticDataIndexService>();
        return serviceCollection;
    }
}