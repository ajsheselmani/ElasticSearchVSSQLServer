using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Persistence.SQLData;
public class HMTransactionsTrainDTO
{
    public DateOnly Date { get; set; }

    public string CustomerId { get; set; }

    public int ArticleId { get; set; }

    public double? Price { get; set; }

    public byte? SalesChannelId { get; set; }

    //public virtual HMArticlesDTO Article { get; set; }

    //public virtual HMCustomersDTO Customer { get; set; }
}
