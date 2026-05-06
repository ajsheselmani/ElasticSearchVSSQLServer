using Elastic.Clients.Elasticsearch;
using ElasticSearchVSSQLServer.Indexing.Configuration;
using Microsoft.Extensions.Options;

namespace ElasticSearchVSSQLServer.Indexing.Services
{
    public abstract class ElasticClient(IOptions<ElasticConfiguration> options, ElasticsearchClient elasticsearchClient)
    {
        protected readonly ElasticConfiguration config = options.Value;
        protected readonly ElasticsearchClient ElasticsearchClient = elasticsearchClient;

        protected ElasticsearchClient getElasticClient()
            => ElasticsearchClient;

        protected ElasticsearchClient getElasticClient(string indexName)
            => ElasticsearchClient;
    }
}
