using AutoMapper;
using ElasticSearchVSSQLServer.Domain.Services.SQLData;
using ElasticSearchVSSQLServer.Indexing.Models;
using ElasticSearchVSSQLServer.Indexing.Models.Datasets;
using ElasticSearchVSSQLServer.Indexing.Services;
using ElasticSearchVSSQLServer.Persistence.Audit;
using ElasticSearchVSSQLServer.Persistence.SQLData;
using ElasticSearchVSSQLServer.RestApi.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ElasticSearchVSSQLServer.RestApi.Controllers;
[Route("api/[controller]")]
[ApiController, Authorize]
public class ElasticDataController(IMapper mapper, ILogger<ElasticDataController> logger, IElasticDataIndexService elasticDataService, IIndexService indexService, ISQLDataService sqlDataService, IElasticDataIndexService elasticDataIndexService) : ControllerBase
{
    private const string BankDatasetIndexName = "elasticvssql_bank";
    private const string HMFashionDatasetIndexName = "elasticvssql_hmfashion";

    [HttpPost("BankDatasetElastic")]
    public async Task<IActionResult> BankDatasetElastic()
    {
        string lastId = "0";
        int batchSize = 5000;
        int totalIndexed = 0;

        _ = Task.Run(async () =>
        {
            while (true)
            {
                try
                {
                    var batch = await sqlDataService.GetBankBatch(lastId, batchSize);

                    if (batch == null || !batch.Any())
                        break;

                    await indexService.IndexData(batch.ToArray(), BankDatasetIndexName);

                    // Update the pointer to the last ID in this batch
                    lastId = batch.Max(x => x.Id);
                    totalIndexed += batch.Count;

                    logger.LogInformation("Successfully indexed {Total} rows. Last ID: {Id}", totalIndexed, lastId);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Sync failed at ID {Id}", lastId);
                    break;
                }
            }
        });

        return Accepted("Background synchronization started.");
    }

    [HttpPut("ElectronicsDataSearch")]
    public async Task<IActionResult> ElectronicsDataSearch(int page, int pageSize, string? query, SearchParamsNew search)
    {
        var userId = UserClaimHelper.GetUserId(User);
        var result = await indexService.SearchNew<ElectronicEventsDTO>(page, pageSize, query, search, "elasticvssql");
        logger.LogInformation("Kerkimi në indeksim me parametrat: Page={Page}, PageSize={PageSize}, Query={Query} u krye me sukses nga perdoruesi me ID: {UserId}.", page, pageSize, query, userId);
        return Ok(result);
    }

    [HttpPut("LogsDataSearch")]
    public async Task<IActionResult> LogsDataSearch([FromQuery]int page, [FromQuery] int pageSize, [FromQuery] string? query, [FromBody] SearchParamsNew search)
    {
        var userId = UserClaimHelper.GetUserId(User);
        var result = await indexService.SearchNew<LogDTO>(page, pageSize, query, search, "elasticvssql_logs");
        logger.LogInformation("Kerkimi në indeksim me parametrat: Page={Page}, PageSize={PageSize}, Query={Query} u krye me sukses nga perdoruesi me ID: {UserId}.", page, pageSize, query, userId);
        return Ok(result);
    }

    [HttpPost("HMFashionFlatElastic")]
    public async Task<IActionResult> HMFashionFlatElastic(int batchSize = 10000)
    {
        DateOnly? lastDate = null;
        string lastCustomerId = string.Empty;
        int? lastArticleId = null;
        long totalIndexed = 0;

        _ = Task.Run(async () =>
        {
            while (true)
            {
                try
                {
                    var batch = await sqlDataService.GetHMFashionFlatBatch(lastDate, lastCustomerId, lastArticleId, batchSize);

                    if (batch == null || batch.Count == 0)
                        break;

                    var mappedData = mapper.Map<H_MFashionFlatIndexDTO[]>(batch);
                    await indexService.IndexData(mappedData, HMFashionDatasetIndexName);

                    var lastRecord = batch.Last();
                    lastDate = DateOnly.FromDateTime(lastRecord.TransactionDate);
                    lastCustomerId = lastRecord.CustomerId;
                    lastArticleId = (int)lastRecord.ArticleId;
                    totalIndexed += batch.Count;

                    logger.LogInformation("H&M flat indexing progress: {TotalIndexed} rows. Cursor: {Date} | {CustomerId} | {ArticleId}", totalIndexed, lastDate, lastCustomerId, lastArticleId);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "H&M flat indexing failed at cursor {Date} | {CustomerId} | {ArticleId}", lastDate, lastCustomerId, lastArticleId);
                    break;
                }
            }
        });

        return Accepted($"Background H&M flat synchronization started with batch size {batchSize}.");
    }
}
