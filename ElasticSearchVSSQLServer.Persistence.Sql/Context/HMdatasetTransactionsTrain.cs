using System;
using System.Collections.Generic;

namespace ElasticSearchVSSQLServer.Persistence.Sql.Context;

public partial class HMdatasetTransactionsTrain
{
    public DateOnly Date { get; set; }

    public string CustomerId { get; set; }

    public int ArticleId { get; set; }

    public double? Price { get; set; }

    public byte? SalesChannelId { get; set; }

    public virtual HMdatasetArticles Article { get; set; }

    public virtual HMdatasetCustomers Customer { get; set; }
}
