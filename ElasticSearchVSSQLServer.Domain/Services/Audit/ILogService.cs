using ElasticSearchVSSQLServer.Persistence.Audit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ElasticSearchVSSQLServer.Domain.Services.Audit;
public interface ILogService
{
    Task<LogDTO> Save(LogDTO logDto);
    Task<IEnumerable<LogDTO>> GetAllLogsData();
}

