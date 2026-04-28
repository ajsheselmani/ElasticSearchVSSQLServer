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
    private const string LogsIndexName = "elasticvssql_logs";

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

    public async Task<LogsReindexResult> ReindexMissingLogsAsync(int batchSize = 500)
    {
        if (batchSize <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(batchSize), "Batch size must be greater than zero.");
        }

        var startedAtUtc = DateTime.UtcNow;
        long lastProcessedSqlId = 0;
        long scannedCount = 0;
        long indexedCount = 0;
        int processedBatches = 0;

        logger.LogInformation(
            "Starting logs synchronization from SQL Server to Elasticsearch. Index={IndexName}, BatchSize={BatchSize}",
            LogsIndexName,
            batchSize);

        await indexService.CreateIndex(LogsIndexName);

        while (true)
        {
            var logsBatch = await logsService.GetLogsBatchAfterIdAsync(lastProcessedSqlId, batchSize);
            if (logsBatch.Count == 0)
            {
                break;
            }

            processedBatches++;
            scannedCount += logsBatch.Count;

            var mappedBatch = mapper.Map<LogsIndexDTO[]>(logsBatch);
            var existingIds = await indexService.GetExistingIdsAsync<LogsIndexDTO>(
                LogsIndexName,
                mappedBatch.Select(log => log.Id));

            var logsToSync = mappedBatch
                .Where(log => !string.IsNullOrWhiteSpace(log.Id))
                .ToArray();

            if (logsToSync.Length > 0)
            {
                await indexService.IndexData(logsToSync, LogsIndexName);
                indexedCount += logsToSync.Length;
            }

            if (!long.TryParse(logsBatch[^1].Id, out lastProcessedSqlId))
            {
                throw new InvalidOperationException($"Could not parse SQL log id '{logsBatch[^1].Id}' during logs reindex.");
            }

            logger.LogInformation(
                "Processed logs sync batch {BatchNumber}. Scanned={ScannedCount}, Synchronized={IndexedCount}, ExistingBeforeSync={ExistingCount}, LastSqlId={LastSqlId}",
                processedBatches,
                scannedCount,
                indexedCount,
                existingIds.Count,
                lastProcessedSqlId);
        }

        var completedAtUtc = DateTime.UtcNow;

        logger.LogInformation(
            "Finished logs synchronization. Scanned={ScannedCount}, Synchronized={IndexedCount}",
            scannedCount,
            indexedCount);

        return new LogsReindexResult(
            LogsIndexName,
            batchSize,
            scannedCount,
            indexedCount,
            0,
            processedBatches,
            startedAtUtc,
            completedAtUtc);
    }

}
