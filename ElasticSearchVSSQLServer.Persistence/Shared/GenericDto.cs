namespace ElasticSearchVSSQLServer.Persistence.Shared;
public class GenericDto<T>
{
    public T Id { get; set; }
    public string NameSq { get; set; }
    public string NameEn { get; set; }
    public string NameSr { get; set; }
}
