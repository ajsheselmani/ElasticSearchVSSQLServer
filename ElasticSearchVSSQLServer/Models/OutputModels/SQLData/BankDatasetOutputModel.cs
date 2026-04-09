namespace ElasticSearchVSSQLServer.RestApi.Models.OutputModels.SQLData
{
    public class BankDatasetOutputModel
    {
        public DateTime? Date { get; set; }

        public string Domain { get; set; }

        public string Location { get; set; }

        public double? Value { get; set; }

        public double? TransactionCount { get; set; }
    }
}
