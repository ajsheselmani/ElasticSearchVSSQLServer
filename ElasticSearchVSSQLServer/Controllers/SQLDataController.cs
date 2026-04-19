using AutoMapper;
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
public class SQLDataController(IMapper mapper, ISQLDataService service, ILogger<UserController> logger, UserManager<ApplicationUser> userManager) : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager = userManager;

    ///<summary>
    ///Retrieves datas from H&MFashion recommmendations dataset.
    ///</summary>
    ///<returns>Returns the data of H&MFashion recommmendations dataset.</returns>
    [HttpGet("GetAllHMData")]
    public async Task<IActionResult> GetAllHMData(
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

        var (items, totalCount) = await service.GetHMFashionData(page, pageSize, parsedFilters, logicType);
        var result = mapper.Map<HMDatasetOutputModel[]>(items);
        return Ok(new { items = result, totalCount });

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
        [FromQuery] string logicType
    ){
        var parsedFilters = string.IsNullOrWhiteSpace(filters)
        ? new List<ElasticSearchVSSQLServer.Domain.FilterItemDto>() 
        : JsonSerializer.Deserialize<List<ElasticSearchVSSQLServer.Domain.FilterItemDto>>(filters,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
          ?? new List<ElasticSearchVSSQLServer.Domain.FilterItemDto>();

        var (items, totalCount) = await service.GetElectronicEvents(page, pageSize, parsedFilters, logicType);
        var result = mapper.Map<ElectronicEventsOutputModel[]>(items);
        return Ok(new {items = result, totalCount});

    }

}