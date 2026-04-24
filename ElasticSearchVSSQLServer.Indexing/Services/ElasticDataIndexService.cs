using AutoMapper;
using ElasticSearchVSSQLServer.Domain.Services.Audit;
using ElasticSearchVSSQLServer.Domain.Services.SQLData;
using ElasticSearchVSSQLServer.Indexing.Models.Datasets;
using ElasticSearchVSSQLServer.Indexing.Models.LogsIndexed;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Services;

public class ElasticDataIndexService(IIndexService indexService, ISQLDataService sQLDataService, ILogService logsService, IMapper mapper, ILogger<ElasticDataIndexService> logger) : IElasticDataIndexService
{
    private const string ElectronicsDatasetIndexName = "elasticvssql_electronics";
    private const string HMFashionDatasetIndexName = "elasticvssql_hmfashion";

    public async Task IndexAllElectronicsDatas()
    {
        //await indexService.CreateIndex(ElectronicsDatasetIndexName);
        var datasToIndex = await sQLDataService.GetAllElectronicEvents();

        var mappedData = mapper.Map<IEnumerable<ElectronicsDatasetIndexDTO>>(datasToIndex).ToArray();

        await indexService.IndexDataBulk<ElectronicsDatasetIndexDTO>(mappedData, ElectronicsDatasetIndexName);
    }

    public async Task IndexAllHMFashionFlatDatas(int batchSize = 10000)
    {
        logger.LogInformation(
            "Starting H&M flat dataset indexing into {IndexName} with batch size {BatchSize}.",
            HMFashionDatasetIndexName,
            batchSize);

        await indexService.CreateIndex(HMFashionDatasetIndexName);
        logger.LogInformation("H&M flat Elasticsearch index {IndexName} is ready.", HMFashionDatasetIndexName);

        DateOnly? lastDate = null;
        string lastCustomerId = string.Empty;
        int? lastArticleId = null;
        double? lastPrice = null;
        byte? lastSalesChannelId = null;
        long totalIndexed = 0;

        while (true)
        {
            logger.LogInformation(
                "Loading next H&M flat SQL batch. Cursor: {Date}, {CustomerId}, {ArticleId}, {Price}, {SalesChannelId}",
                lastDate,
                lastCustomerId,
                lastArticleId,
                lastPrice,
                lastSalesChannelId);

            var batch = await sQLDataService.GetHMFashionFlatBatch(
                lastDate,
                lastCustomerId,
                lastArticleId,
                lastPrice,
                lastSalesChannelId,
                batchSize);

            if (batch == null || batch.Count == 0)
            {
                logger.LogInformation("Finished indexing H&M flat dataset. Total indexed rows: {TotalIndexed}", totalIndexed);
                break;
            }

            var mappedData = mapper.Map<H_MFashionFlatIndexDTO[]>(batch);
            for (var index = 0; index < mappedData.Length; index++)
            {
                mappedData[index].Id = $"hm-fashion-{totalIndexed + index + 1}";
            }

            await indexService.IndexDataBulk(mappedData, HMFashionDatasetIndexName);

            totalIndexed += batch.Count;
            var lastRecord = batch.Last();
            lastDate = lastRecord.Date;
            lastCustomerId = lastRecord.CustomerId;
            lastArticleId = lastRecord.ArticleId;
            lastPrice = lastRecord.Price ?? 0d;
            lastSalesChannelId = lastRecord.SalesChannelId ?? 0;

            logger.LogInformation(
                "Indexed {BatchCount} H&M flat rows. Total: {TotalIndexed}. Cursor: {Date}, {CustomerId}, {ArticleId}, {Price}, {SalesChannelId}",
                batch.Count,
                totalIndexed,
                lastDate,
                lastCustomerId,
                lastArticleId,
                lastPrice,
                lastSalesChannelId);
        }
    }

}
