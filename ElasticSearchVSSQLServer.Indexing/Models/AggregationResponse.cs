using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Models;

public class AggregationResponse
{
    public required string Field { get; set; }
    public required IDictionary<string, long> Aggregations { get; set; }
}
