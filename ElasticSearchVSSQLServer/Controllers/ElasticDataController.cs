using AutoMapper;
using ElasticSearchVSSQLServer.Domain.Services.SQLData;
using ElasticSearchVSSQLServer.Indexing.Models;
using ElasticSearchVSSQLServer.Indexing.Models.Datasets;
using ElasticSearchVSSQLServer.Indexing.Models.LogsIndexed;
using ElasticSearchVSSQLServer.Indexing.Services;
using ElasticSearchVSSQLServer.Persistence.Audit;
using ElasticSearchVSSQLServer.Persistence.SQLData;
using ElasticSearchVSSQLServer.RestApi.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ElasticSearchVSSQLServer.RestApi.Controllers;
[Route("api/[controller]")]
[ApiController, Authorize]
public class ElasticDataController(
    IMapper mapper,
    ILogger<ElasticDataController> logger,
    IServiceScopeFactory serviceScopeFactory,
    IElasticDataIndexService elasticDataIndexService,
    IIndexService indexService,
    ISQLDataService sqlDataService) : ControllerBase
{
    private const string ElectronicsDatasetIndexName = "elasticvssql_electronics";
    private const string HMFashionDatasetIndexName = "elasticvssql_hmfashion";

    [HttpPost("ElectronicsDatasetElasticIndexing")]
    public async Task<IActionResult> ElectronicsDatasetElastic()
    {
        try
        {
            await elasticDataIndexService.IndexAllElectronicsDatas();
            return Ok();
        }
        catch (Exception ex)
        {
            logger.LogInformation(ex.ToString());
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("ElectronicsDataSearch")]
    public async Task<IActionResult> ElectronicsDataSearch([FromQuery] int page, [FromQuery] int pageSize, [FromQuery] string? query, [FromBody] SearchParamsNew search)
    {
        var userId = UserClaimHelper.GetUserId(User);
        var result = await indexService.SearchNew<ElectronicEventsDTO>(page, pageSize, query, search, ElectronicsDatasetIndexName);
        logger.LogInformation("Kerkimi në indeksim me parametrat: Page={Page}, PageSize={PageSize}, Query={Query} u krye me sukses nga perdoruesi me ID: {UserId}.", page, pageSize, query, userId);
        return Ok(result);
    }

    [HttpPut("LogsDataSearch")]
    public async Task<IActionResult> LogsDataSearch([FromQuery]int page, [FromQuery] int pageSize, [FromQuery] string? query, [FromBody] SearchParamsNew search)
    {
        var userId = UserClaimHelper.GetUserId(User);
        var result = await indexService.SearchNew<LogsIndexDTO>(page, pageSize, query, search, "elasticvssql_logs");
        var mappedResult = new PaginatedSearchResponse<LogDTO>
        {
            Hits = mapper.Map<IEnumerable<LogDTO>>(result.Hits),
            Metadata = result.Metadata,
            IsError = result.IsError,
            ErrorDetails = result.ErrorDetails,
            aggregations = result.aggregations,
            globalAggregations = result.globalAggregations
        };
        logger.LogInformation("Kerkimi në indeksim me parametrat: Page={Page}, PageSize={PageSize}, Query={Query} u krye me sukses nga perdoruesi me ID: {UserId}.", page, pageSize, query, userId);
        return Ok(mappedResult);
    }

    [HttpPost("ReindexMissingLogs")]
    public async Task<IActionResult> ReindexMissingLogs([FromQuery] int batchSize = 500)
    {
        try
        {
            var result = await elasticDataIndexService.ReindexMissingLogsAsync(batchSize);
            logger.LogInformation(
                "Missing logs reindex completed. BatchSize={BatchSize}, Scanned={ScannedCount}, Indexed={IndexedCount}",
                result.BatchSize,
                result.ScannedCount,
                result.IndexedCount);
            return Ok(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Missing logs reindex failed.");
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("HMFashionFlatSearch")]
    public async Task<IActionResult> HMFashionFlatSearch([FromQuery] int page, [FromQuery] int pageSize, [FromQuery] string? query, [FromBody] SearchParamsNew search)
    {
        var userId = UserClaimHelper.GetUserId(User);
        var result = await indexService.SearchNew<H_MFashionFlatIndexDTO>(page, pageSize, query, search, HMFashionDatasetIndexName);
        logger.LogInformation("H&M flat search executed with Page={Page}, PageSize={PageSize}, Query={Query} by user {UserId}.", page, pageSize, query, userId);
        return Ok(result);
    }

    [HttpPost("HMFashionFlatElastic")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(HMFashionFlatElasticStartResponse), StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> HMFashionFlatElastic(int batchSize = 10000)
    {
        if (batchSize <= 0)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid batch size.",
                Detail = "Batch size must be greater than zero.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var startedAtUtc = DateTime.UtcNow;

        try
        {
            logger.LogInformation(
                "Preparing H&M flat indexing. Creating or verifying Elasticsearch index {IndexName}. BatchSize={BatchSize}",
                HMFashionDatasetIndexName,
                batchSize);

            await indexService.CreateIndex(HMFashionDatasetIndexName);
            logger.LogInformation("Elasticsearch index {IndexName} is ready. Starting background import.", HMFashionDatasetIndexName);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Could not create or verify Elasticsearch index {IndexName}.", HMFashionDatasetIndexName);

            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Could not start H&M flat indexing.",
                Detail = ex.Message,
                Status = StatusCodes.Status500InternalServerError
            });
        }

        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = serviceScopeFactory.CreateScope();
                var scopedIndexService = scope.ServiceProvider.GetRequiredService<IElasticDataIndexService>();

                await scopedIndexService.IndexAllHMFashionFlatDatas(batchSize);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "H&M flat indexing failed.");
            }
        });

        return StatusCode(
            StatusCodes.Status202Accepted,
            new HMFashionFlatElasticStartResponse(
                "Background H&M flat synchronization started.",
                HMFashionDatasetIndexName,
                batchSize,
                startedAtUtc));
    }
}

public record HMFashionFlatElasticStartResponse(
    string Message,
    string IndexName,
    int BatchSize,
    DateTime StartedAtUtc);
