using ElasticSearchVSSQLServer.Indexing.Configuration;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Services;

public class IndexService(IOptions<ElasticConfiguration> config) : ElasticClient(config), IIndexService
{
}