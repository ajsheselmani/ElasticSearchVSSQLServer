using ElasticSearchVSSQLServer.Indexing.Models.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Models;

public class DataFilter
{
    public DataFilterType Type { get; set; }
    public required string PropertyName { get; set; }
    public DataFilterOperator Operator { get; set; }
    public required string Value { get; set; }
    public bool CaseSensitive { get; set; }
    public IEnumerable<DataFilter>? or { get; set; } = [];

    public IEnumerable<DataFilter>? and { get; set; } = [];

}
