using AutoMapper;
using ElasticSearchVSSQLServer.Domain.Services.Audit;
using ElasticSearchVSSQLServer.Persistence.Identity;
using ElasticSearchVSSQLServer.RestApi.Models.OutputModels.Logs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

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
    public async Task<IActionResult> GetLogsData()
    {
        var logsData = await logService.GetAllLogsData();
        var result = mapper.Map<LogsOutputModel[]>(logsData);
        return Ok(result);

    }
}