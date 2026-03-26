using ElasticSearchVSSQLServer.Indexing.Models.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Models;

public class SortInfo
{
    public string PropertyName { get; set; }
    public SortDirection Direction { get; set; }
}
