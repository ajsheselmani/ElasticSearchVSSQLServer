using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Models;

public class SearchParamsNew
{
    public IEnumerable<DataFilter> filter { get; set; } = new List<DataFilter>();

    public IEnumerable<SortType>? sortOrders { get; set; } = new List<SortType>();

    public IEnumerable<AggregationType>? aggregations { get; set; } = new List<AggregationType>();
}
