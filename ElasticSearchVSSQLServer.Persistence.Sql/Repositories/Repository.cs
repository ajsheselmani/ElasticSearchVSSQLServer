using ElasticSearchVSSQLServer.Domain.Repositories;
using ElasticSearchVSSQLServer.Persistence.Sql.Context;
using ElasticSearchVSSQLServer.Persistence.SQLData;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Persistence.Sql.Repositories;

public class Repository(ApplicationDBService dbContextService) : IRepository
{
    public async Task<List<HMFashionDatasetDTO>> GetHMFashionFlatBatch(DateOnly? lastDate, string lastCustomerId, int? lastArticleId, int batchSize)
    {
        var transactions = dbContextService.DbContext.HMdatasetTransactionsTrain.AsQueryable();

        if (lastDate.HasValue)
        {
            transactions = transactions.Where(t =>
                t.Date > lastDate.Value ||
                (t.Date == lastDate.Value && string.Compare(t.CustomerId, lastCustomerId) > 0) ||
                (t.Date == lastDate.Value && t.CustomerId == lastCustomerId && t.ArticleId > (lastArticleId ?? 0)));
        }

        var query = from t in transactions
                    join c in dbContextService.DbContext.HMdatasetCustomers on t.CustomerId equals c.Id
                    join a in dbContextService.DbContext.HMdatasetArticles on t.ArticleId equals a.Id
                    orderby t.Date, t.CustomerId, t.ArticleId
                    select new HMFashionFlatSqlRow
                    {
                        //Id = $"{t.Date:yyyy-MM-dd}_{t.CustomerId}_{t.ArticleId}_{t.SalesChannelId}_{t.Price}",
                        Date = t.Date,
                        Price = t.Price ?? 0,
                        CustomerId = t.CustomerId,
                        Age = c.Age,
                        ClubMemberStatus = c.ClubMemberStatus,
                        FashionNewsFrequency = c.FashionNewsFrequency,
                        PostalCode = c.PostalCode,
                        ArticleId = t.ArticleId,
                        ProdName = a.ProdName,
                        ProductTypeName = a.ProductTypeName,
                        ProductGroupName = a.ProductGroupName,
                        ColourGroupName = a.ColourGroupName,
                        DepartmentName = a.DepartmentName,
                        IndexName = a.IndexName,
                        IndexGroupName = a.IndexGroupName,
                        SectionName = a.SectionName,
                        GarmentGroupName = a.GarmentGroupName,
                        DetailDesc = a.DetailDesc,
                        ProductCode = a.ProductCode,
                        GraphicalAppearanceName = a.GraphicalAppearanceName,
                        PerceivedColourValueName = a.PerceivedColourValueName,
                    };

        var records = await EntityFrameworkQueryableExtensions.ToListAsync(query.Take(batchSize));

        return records.Select(x => new HMFashionDatasetDTO
        {
            //Id = x.Id,
            Date = x.Date,
            Price = x.Price,
            CustomerId = x.CustomerId,
            Age = x.Age ?? "0",
            ClubMemberStatus = x.ClubMemberStatus,
            FashionNewsFrequency = x.FashionNewsFrequency,
            PostalCode = x.PostalCode,
            ArticleId = x.ArticleId,
            ProdName = x.ProdName,
            ProductTypeName = x.ProductTypeName,
            ProductGroupName = x.ProductGroupName,
            ColourGroupName = x.ColourGroupName,
            DepartmentName = x.DepartmentName,
            IndexName = x.IndexName,
            IndexGroupName = x.IndexGroupName,
            SectionName = x.SectionName,
            GarmentGroupName = x.GarmentGroupName,
            DetailDesc = x.DetailDesc,
            ProductCode = x.ProductCode,
            PerceivedColourValueName = x.PerceivedColourValueName,
            GraphicalAppearanceName = x.GraphicalAppearanceName
        }).ToList();
    }

    private class HMFashionFlatSqlRow
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
