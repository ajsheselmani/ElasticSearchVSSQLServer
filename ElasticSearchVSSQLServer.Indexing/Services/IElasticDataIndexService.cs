using System;
using System.Collections.Generic;
using System.Text;

using ElasticSearchVSSQLServer.Indexing.Models.LogsIndexed;

namespace ElasticSearchVSSQLServer.Indexing.Services;
public interface IElasticDataIndexService
{
    Task IndexAllElectronicsDatas();
    Task IndexAllHMFashionFlatDatas(int batchSize = 10000);
    Task<LogsReindexResult> ReindexMissingLogsAsync(int batchSize = 500);
}
