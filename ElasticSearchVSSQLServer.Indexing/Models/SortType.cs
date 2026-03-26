using Elastic.Clients.Elasticsearch;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Models;

public class SortType
{
    public required string Key { get; set; }
    public SortOrder sortOrder { get; set; }
}
