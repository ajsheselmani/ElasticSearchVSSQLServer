using AutoMapper;
using ElasticSearchVSSQLServer.Domain.Services.Audit;
using ElasticSearchVSSQLServer.Persistence.Identity;
using ElasticSearchVSSQLServer.RestApi.Models.OutputModels.Logs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace ElasticSearchVSSQLServer.RestApi.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class LogsController(IMapper mapper, ILogger<LogsController> logger, UserManager<ApplicationUser> userManager, ILogService logService) : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager = userManager;

    ///<summary>
    ///Retrieves datas from Log table.
    ///</summary>
    ///<returns>Returns logs of the system.</returns>
    [HttpGet("GetAllLogsData")]
    public async Task<IActionResult> GetLogsData(
        [FromQuery] int page,
        [FromQuery] int pageSize,
        [FromQuery] string? filters,
        [FromQuery] string logicType
    ){
        var parsedFilters = string.IsNullOrWhiteSpace(filters)
        ? new List<ElasticSearchVSSQLServer.Domain.FilterItemDto>()
        : JsonSerializer.Deserialize<List<ElasticSearchVSSQLServer.Domain.FilterItemDto>>(filters,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
          ?? new List<ElasticSearchVSSQLServer.Domain.FilterItemDto>();

        var (items, totalCount) = await logService.GetAllLogsData(page, pageSize, parsedFilters, logicType);
        var result = mapper.Map<LogsOutputModel[]>(items);
        return Ok(new { items = result, totalCount });

    }
}