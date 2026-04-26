using AutoMapper;
using ElasticSearchVSSQLServer.Domain;
using ElasticSearchVSSQLServer.Domain.Services.SQLData;
using ElasticSearchVSSQLServer.Persistence.Identity;
using ElasticSearchVSSQLServer.RestApi.Models.OutputModels.SQLData;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using RBO.RestApi.Areas.Administration.Controllers;
using System.Text.Json;

namespace ElasticSearchVSSQLServer.RestApi.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class SQLDataController(IMapper mapper, ISQLDataService service, ILogger<SQLDataController> logger, UserManager<ApplicationUser> userManager) : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly ILogger<SQLDataController> _logger = logger;

    ///<summary>
    ///Retrieves paged transaction rows from HMdatasetTransactionsTrain with article and customer data.
    ///</summary>
    ///<returns>Returns paged HM transactions for datagrid usage.</returns>
    [HttpGet("GetAllHMTransactionsTrain")]
    public async Task<IActionResult> GetAllHMTransactionsTrain(
        [FromQuery] int page,
        [FromQuery] int pageSize,
        [FromQuery] string? filters,
        [FromQuery] string logicType = "and"
    )
    {
        return await GetHMTransactionsTrainDataInternal(page, pageSize, filters, logicType);
    }

    ///<summary>
    ///Retrieves datas from electronicEvents dataset.
    ///</summary>
    ///<returns>Returns the data of electronicEvents dataset.</returns>
    [HttpGet("GetAllElectronicEvents")]
    public async Task<IActionResult> ElectronicEvents(
        [FromQuery] int page,
        [FromQuery] int pageSize,
        [FromQuery] string? filters,
        [FromQuery] string logicType = "and"
    )
    {
        try
        {
            var parsedFilters = ParseFilters(filters);
            var (items, totalCount) = await service.GetElectronicEvents(page, pageSize, parsedFilters, logicType);
            var result = mapper.Map<ElectronicEventsOutputModel[]>(items);
            return Ok(new { items = result, totalCount });
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Invalid electronics filters payload. Page: {Page}, PageSize: {PageSize}, LogicType: {LogicType}", page, pageSize, logicType);
            return BadRequest(new
            {
                message = "Invalid filters JSON format."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load electronics data. Page: {Page}, PageSize: {PageSize}, LogicType: {LogicType}", page, pageSize, logicType);
            return Problem(
                title: "Failed to load electronics data.",
                detail: ex.Message,
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    private async Task<IActionResult> GetHMTransactionsTrainDataInternal(
        int page,
        int pageSize,
        string? filters,
        string logicType)
    {
        try
        {
            var parsedFilters = ParseFilters(filters);
            var (items, totalCount) = await service.GetHMFashionData(page, pageSize, parsedFilters, logicType);
            var result = mapper.Map<HMDatasetOutputModel[]>(items);
            return Ok(new { items = result, totalCount });
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Invalid HM filters payload. Page: {Page}, PageSize: {PageSize}, LogicType: {LogicType}", page, pageSize, logicType);
            return BadRequest(new
            {
                message = "Invalid filters JSON format."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load HM data. Page: {Page}, PageSize: {PageSize}, LogicType: {LogicType}", page, pageSize, logicType);
            return Problem(
                title: "Failed to load HM data.",
                detail: ex.Message,
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    private static List<FilterItemDto> ParseFilters(string? filters)
        => string.IsNullOrWhiteSpace(filters)
            ? new List<FilterItemDto>()
            : JsonSerializer.Deserialize<List<FilterItemDto>>(
                filters,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
              ?? new List<FilterItemDto>();
}
