using ElasticSearchVSSQLServer.Domain.Repositories;
using ElasticSearchVSSQLServer.Persistence.Audit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ElasticSearchVSSQLServer.Domain.Services.Audit;
public class LogService(IGenericRepository<LogDTO, int> logRepository ): ILogService
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
}

