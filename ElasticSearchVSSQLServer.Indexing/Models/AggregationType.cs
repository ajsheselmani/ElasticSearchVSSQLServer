using Elastic.Clients.Elasticsearch.Aggregations;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Models;

public class AggregationType
{
    public required string Property { get; set; }
    public int Size { get; set; } = 10;
    public string? AggregationTypes { get; set; }
    public CalendarInterval? Interval { get; set; }
    public AggregationType[]? ChildProperty { get; set; }
}