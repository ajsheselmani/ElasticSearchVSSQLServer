using Newtonsoft.Json;
using System.Text.Json.Serialization;

namespace ElasticSearchVSSQLServer.Persistence.Audit;

public class LogEntry
{
    [JsonProperty(PropertyName = "_id")]
    public string? Id { get; set; }

    [JsonProperty("@timestamp")]
    public DateTime Timestamp { get; set; }

    public string? Level { get; set; }

    public string? MessageTemplate { get; set; }

    public string? Message { get; set; }

    [JsonPropertyName("fields")]
    public Field? fields { get; set; }
}

public class Field
{
    public string? Email { get; set; }
    public string? UserFullName { get; set; }
    public string? UserId { get; set; }
    public string? Name { get; set; }
    public string? SourceContext { get; set; }
    public string? ActionId { get; set; }
    public string? ActionName { get; set; }
    public string? RequestId { get; set; }
    public string? RequestPath { get; set; }
    public string? Environment { get; set; }
}