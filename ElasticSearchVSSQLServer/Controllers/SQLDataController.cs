using AutoMapper;
using ElasticSearchVSSQLServer.Domain.Services.SQLData;
using ElasticSearchVSSQLServer.Persistence.Identity;
using ElasticSearchVSSQLServer.RestApi.Models.OutputModels.SQLData;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using RBO.RestApi.Areas.Administration.Controllers;

namespace ElasticSearchVSSQLServer.RestApi.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class SQLDataController(IMapper mapper, ISQLDataService service, ILogger<UserController> logger, UserManager<ApplicationUser> userManager) : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager = userManager;

    ///<summary>
    ///Retrieves datas from bank dataset.
    ///</summary>
    ///<returns>Returns the data of bank dataset.</returns>
    [HttpGet("GetAllBankData")]
    public async Task<IActionResult> GetBankData()
    {
        var bankData = await service.GetAllBankData();
        var result = mapper.Map<BankDatasetOutputModel[]>(bankData);
        return Ok(result);

    }

}