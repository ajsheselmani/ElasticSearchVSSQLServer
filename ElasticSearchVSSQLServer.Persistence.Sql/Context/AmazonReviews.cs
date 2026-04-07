using System;
using System.Collections.Generic;

namespace ElasticSearchVSSQLServer.Persistence.Sql.Context;

public partial class AmazonReviews
{
    public string UserName { get; set; }

    public string Verified { get; set; }

    public string ItemName { get; set; }

    public string Description { get; set; }

    public string Image { get; set; }

    public string Brand { get; set; }

    public string Feature { get; set; }

    public string Category { get; set; }

    public string Price { get; set; }

    public decimal? Rating { get; set; }

    public DateOnly? ReviewTime { get; set; }

    public string Summary { get; set; }

    public string ReviewText { get; set; }

    public int? Vote { get; set; }
}
