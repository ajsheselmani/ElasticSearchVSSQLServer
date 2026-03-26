using Elastic.Clients.Elasticsearch;
using Elastic.Transport;
using ElasticSearchVSSQLServer.Indexing.Configuration;
using ElasticSearchVSSQLServer.Indexing.Services;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Extensions;
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddIndexing(this IServiceCollection serviceCollection, ElasticConfiguration configuration)
    {
        serviceCollection.AddSingleton(configuration);

        serviceCollection.Configure<ElasticConfiguration>(options =>
        {
            options.Uri = configuration.Uri;
            options.Index = configuration.Index;
            options.CertificateFingerprint = configuration.CertificateFingerprint;
            options.Password = configuration.Password;
            options.Username = configuration.Username;
        });

        var settings = new ElasticsearchClientSettings(new Uri(configuration.Uri))
            .CertificateFingerprint(configuration.CertificateFingerprint)
            .Authentication(new BasicAuthentication(configuration.Username, configuration.Password));

        serviceCollection.AddScoped<IIndexService, IndexService>();
        return serviceCollection;
    }
}