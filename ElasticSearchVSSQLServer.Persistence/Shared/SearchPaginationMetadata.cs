namespace ElasticSearchVSSQLServer.Persistence.Shared;

public class SearchPaginationMetadata {
    public long TotalCount { get; set; }
    public int PageSize { get; set; }
    public int CurrentPage { get; set; }
    public long TotalPages { get; set; }
    public bool PreviousPage { get; set; }
    public bool NextPage { get; set; }
}