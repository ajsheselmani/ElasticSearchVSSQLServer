using ElasticSearchVSSQLServer.Domain.Configuration;
using ElasticSearchVSSQLServer.Indexing.Configuration;
using ElasticSearchVSSQLServer.Persistence.Sql.Configuration;

namespace ElasticSearchVSSQLServer.RestApi.Configuration;

public class ApiConfiguration
{
    public string ClientUrl { get; set; }

    public string ApplicationName { get; set; }

    public DatabaseConfiguration DatabaseConfiguration { get; set; }

    public DomainConfiguration DomainConfiguration { get; set; }

    public ElasticConfiguration ElasticConfiguration { get; set; }
}