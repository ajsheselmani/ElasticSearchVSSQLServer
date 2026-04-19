namespace ElasticSearchVSSQLServer.RestApi.Utils;
public class FilterItemDto
{
    public string PropertyName { get; set; }
    public string Operator { get; set; }
    public string? Value { get; set; }
    public bool Negate { get; set; }
    public bool CaseSensitive { get; set; }
}
