using Elastic.Clients.Elasticsearch;
using Elastic.Transport;
using ElasticSearchVSSQLServer.Indexing.Configuration;
using Microsoft.Extensions.Options;
using Nest;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Services
{
    public abstract class ElasticClient(IOptions<ElasticConfiguration> options, ElasticsearchClient elasticsearchClient)
    {
        protected readonly ElasticConfiguration config = options.Value;
        protected readonly ElasticsearchClient ElasticsearchClient = elasticsearchClient;

        protected ElasticsearchClient getElasticClient()
        {
            var settings = new ElasticsearchClientSettings(new Uri(config.Uri)).Authentication(new BasicAuthentication(config.Username, config.Password));

            var client = new ElasticsearchClient(settings);
            return client;
        }

        protected ElasticsearchClient getElasticClient(string indexName)
        {
            var settings = new ElasticsearchClientSettings(new Uri(config.Uri))
                .Authentication(new BasicAuthentication(config.Username, config.Password))
                .ServerCertificateValidationCallback((o, certificate, chain, errors) => true)
                .DefaultIndex(indexName)
                .DisableDirectStreaming();

            var client = new ElasticsearchClient(settings);
            return client;
        }
    }
}
