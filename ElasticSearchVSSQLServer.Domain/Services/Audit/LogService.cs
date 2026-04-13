using ElasticSearchVSSQLServer.Domain.Repositories;
using ElasticSearchVSSQLServer.Persistence.Audit;
using ElasticSearchVSSQLServer.Persistence.SQLData;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ElasticSearchVSSQLServer.Domain.Services.Audit;
public class LogService(IGenericRepository<LogDTO, string> logRepository, ILogger<LogService> logger): ILogService
{
    public async Task<LogDTO> Save(LogDTO logDto)
    {
        if (logDto.Error)
        {
            logRepository.ClearChangeTracker();
        }
        
        var logToReturn = await logRepository.AddAsync(logDto);
        return logToReturn;
    }

    public async Task<(IEnumerable<LogDTO> items, long TotalCount)> GetAllLogsData(int page, int pageSize)
    {
        logger.LogInformation("Kerkese per marrje te te gjithe llogave te sistemit nga SQLServer");
        var logsData = await logRepository.GetPagedAsync(page, pageSize);
        logger.LogInformation("Marrja e te gjithe llogave te sistemit. Numri i rekordeve: {Count}", logsData.Items?.Count() ?? 0, logsData.TotalCount);
        return logsData;
    }
}

