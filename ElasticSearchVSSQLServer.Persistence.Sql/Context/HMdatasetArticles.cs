using System;
using System.Collections.Generic;

namespace ElasticSearchVSSQLServer.Persistence.Sql.Context;

public partial class HMdatasetArticles
{
    public int Id { get; set; }

    public int ProductCode { get; set; }

    public string ProdName { get; set; }

    public short ProductTypeNo { get; set; }

    public string ProductTypeName { get; set; }

    public string ProductGroupName { get; set; }

    public int? GraphicalAppearanceNo { get; set; }

    public string GraphicalAppearanceName { get; set; }

    public byte? ColourGroupCode { get; set; }

    public string ColourGroupName { get; set; }

    public byte? PerceivedColourValueId { get; set; }

    public string PerceivedColourValueName { get; set; }

    public byte? PerceivedColourMasterId { get; set; }

    public string PerceivedColourMasterName { get; set; }

    public short DepartmentNo { get; set; }

    public string DepartmentName { get; set; }

    public string IndexCode { get; set; }

    public string IndexName { get; set; }

    public byte IndexGroupNo { get; set; }

    public string IndexGroupName { get; set; }

    public byte SectionNo { get; set; }

    public string SectionName { get; set; }

    public short GarmentGroupNo { get; set; }

    public string GarmentGroupName { get; set; }

    public string DetailDesc { get; set; }
}
