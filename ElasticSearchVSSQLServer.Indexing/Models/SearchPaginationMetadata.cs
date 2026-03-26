using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Models;

public class SearchPaginationMetadata
{
    public long TotalCount { get; set; }
    public int PageSize { get; set; }
    public int CurrentPage { get; set; }
    public long TotalPages { get; set; }
    public bool PreviousPage { get; set; }
    public bool NextPage { get; set; }
}
