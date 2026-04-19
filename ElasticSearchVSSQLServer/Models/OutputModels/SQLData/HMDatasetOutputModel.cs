namespace ElasticSearchVSSQLServer.RestApi.Models.OutputModels.SQLData
{
    public class HMDatasetOutputModel
    {
        public int ArticleId { get; set; }
        public int ProductCode { get; set; }
        public string ProdName { get; set; }
        public string ProductTypeName { get; set; }
        public string ProductGroupName { get; set; }
        public string GraphicalAppearanceName { get; set; }
        public string ColourGroupName { get; set; }
        public string PerceivedColourValueName { get; set; }
        public string DepartmentName { get; set; }
        public string IndexName { get; set; }
        public string IndexGroupName { get; set; }
        public string SectionName { get; set; }
        public string GarmentGroupName { get; set; }
        public string DetailDesc { get; set; }

        public string CustomerId { get; set; }
        public string ClubMemberStatus { get; set; }
        public string FashionNewsFrequency { get; set; }
        public string Age { get; set; }
        public string PostalCode { get; set; }

        public double? Price { get; set; }
        public DateOnly Date { get; set; }
    }
}
