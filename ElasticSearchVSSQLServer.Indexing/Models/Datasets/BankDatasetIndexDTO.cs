using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Models.BankDataset;
public class BankDatasetIndexDTO
{
    public DateTime? Date { get; set; }

    public string Domain { get; set; }

    public string Location { get; set; }

    public double? Value { get; set; }

    public double? TransactionCount { get; set; }
}
