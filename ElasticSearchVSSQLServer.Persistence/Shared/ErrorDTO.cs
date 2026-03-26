namespace ElasticSearchVSSQLServer.Persistence.Shared;

public class ErrorDTO {
    public ErrorTypeEnum ErrorType { get; set; }
    public string? Message { get; set; }
}
