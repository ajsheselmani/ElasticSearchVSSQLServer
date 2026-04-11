namespace ElasticSearchVSSQLServer.RestApi.Models.OutputModels.SQLData;
    public class ElectronicEventsOutputModel
    {
        public int Id { get; set; }

        public string EventTime { get; set; }

        public string EventType { get; set; }

        public int ProductId { get; set; }

        public long CategoryId { get; set; }

        public string CategoryCode { get; set; }

        public string Brand { get; set; }

        public string Price { get; set; }

        public long UserId { get; set; }

        public string UserSession { get; set; }
    }
