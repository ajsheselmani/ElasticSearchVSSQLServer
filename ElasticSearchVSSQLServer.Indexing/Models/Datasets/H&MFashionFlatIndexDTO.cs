using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Models.Datasets;

public class H_MFashionFlatIndexDTO
{
    public string Id { get; set; } = default!;

    public DateTime TransactionDate { get; set; }
    public decimal Price { get; set; }
    public int SalesChannelId { get; set; }

    public string CustomerId { get; set; } = default!;
    public int? Age { get; set; }
    public string? ClubMemberStatus { get; set; }
    public string? FashionNewsFrequency { get; set; }
    public string? PostalCode { get; set; }

    public long ArticleId { get; set; }
    public string? ProdName { get; set; }
    public string? ProductTypeName { get; set; }
    public string? ProductGroupName { get; set; }
    public string? ColourGroupName { get; set; }
    public string? DepartmentName { get; set; }
    public string? IndexName { get; set; }
    public string? IndexGroupName { get; set; }
    public string? SectionName { get; set; }
    public string? GarmentGroupName { get; set; }
    public string? DetailDesc { get; set; }

};
