using Nest;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace ElasticSearchVSSQLServer.Indexing.Models.Datasets;

public class ElectronicsDatasetIndexDTO
{
    [JsonPropertyName("id")]
    public long? Id { get; set; }

    [PropertyName("event_time")]          // ← kjo e lexon Elastic
    [JsonPropertyName("event_time")]      // ← kjo për JSON të zakonshëm
    public string? EventTime { get; set; }

    [PropertyName("event_type")]
    [JsonPropertyName("event_type")]
    public string? EventType { get; set; }

    [PropertyName("product_id")]
    [JsonPropertyName("product_id")]
    public int? ProductId { get; set; }

    [PropertyName("category_id")]
    [JsonPropertyName("category_id")]
    public long? CategoryId { get; set; }

    [PropertyName("category_code")]
    [JsonPropertyName("category_code")]
    public string? CategoryCode { get; set; }

    [PropertyName("brand")]
    [JsonPropertyName("brand")]
    public string? Brand { get; set; }

    [PropertyName("price")]
    [JsonPropertyName("price")]
    public string? Price { get; set; }

    [PropertyName("user_id")]
    [JsonPropertyName("user_id")]
    public long? UserId { get; set; }

    [PropertyName("user_session")]
    [JsonPropertyName("user_session")]
    public string? UserSession { get; set; }
}