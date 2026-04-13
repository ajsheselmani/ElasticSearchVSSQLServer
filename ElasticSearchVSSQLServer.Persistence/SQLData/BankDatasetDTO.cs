using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Persistence.SQLData;
public class BankDatasetDTO
{
    public string Id { get; set; }

    public DateTime? Date { get; set; }

    public string Domain { get; set; }

    public string Location { get; set; }

    public double? Value { get; set; }

    public double? TransactionCount { get; set; }
}