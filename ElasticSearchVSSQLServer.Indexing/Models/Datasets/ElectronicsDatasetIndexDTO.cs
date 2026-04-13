using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Models.Datasets;

public class ElectronicsDatasetIndexDTO
{
    public string Id { get; set; }

    public string Event_time { get; set; }

    public string Event_type { get; set; }

    public int Product_id { get; set; }

    public long Category_id { get; set; }

    public string Category_code { get; set; }

    public string Brand { get; set; }

    public string Price { get; set; }

    public long User_id { get; set; }

    public string User_session { get; set; }
};
