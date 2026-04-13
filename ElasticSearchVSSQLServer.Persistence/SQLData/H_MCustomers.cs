using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Persistence.SQLData;

public class H_MCustomers
{
    public string Id { get; set; } = default!;
    public string? ClubMemberStatus { get; set; }
    public string? FashionNewsFrequency { get; set; }
    public string? Age { get; set; }
    public string? PostalCode { get; set; }
}

public class H_MArticles
{
    public long Id { get; set; }
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
}

public class H_MTransactionTrain
{
    public DateTime Date { get; set; }
    public string CustomerId { get; set; } = default!;
    public long ArticleId { get; set; }
    public decimal Price { get; set; }
    public int SalesChannelId { get; set; }
}
