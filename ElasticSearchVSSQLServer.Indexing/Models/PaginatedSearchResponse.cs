using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Models;

public class PaginatedSearchResponse<T>
{
    public IEnumerable<T> Hits { get; set; }
    public SearchPaginationMetadata Metadata { get; set; }
    public bool? IsError { get; set; }
    public string ErrorDetails { get; set; }
    public IEnumerable<AggregationResponse>? aggregations { get; set; }
    public IEnumerable<AggregationResponse>? globalAggregations { get; set; }
}
