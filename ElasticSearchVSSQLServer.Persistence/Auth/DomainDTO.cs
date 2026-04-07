namespace ElasticSearchVSSQLServer.Persistence.Domain;

public class DomainDTO {
    public int DomainId { get; set; }
    public string Name { get; set; }
    public bool Active { get; set; }
    public string InsertedFrom { get; set; }
    public DateTime InsertedDate { get; set; }
    public string? UpdatedFrom { get; set; }
    public DateTime? UpdatedDate { get; set; }
}
