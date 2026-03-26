namespace ElasticSearchVSSQLServer.Persistence.Shared;

public class PaginatedSearchResponse<T> {
    public IEnumerable<T> Hits { get; set; }
    public SearchPaginationMetadata Metadata { get; set; }
    public bool? IsError { get; set; }
    public string ErrorDetails { get; set; }
}
