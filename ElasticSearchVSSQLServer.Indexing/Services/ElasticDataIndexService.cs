using AutoMapper;
using ElasticSearchVSSQLServer.Domain.Services.Audit;
using ElasticSearchVSSQLServer.Domain.Services.SQLData;
using ElasticSearchVSSQLServer.Indexing.Models.BankDataset;
using ElasticSearchVSSQLServer.Indexing.Models.LogsIndexed;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Services;

public class ElasticDataIndexService(IIndexService indexService, ISQLDataService sQLDataService, ILogService logsService, IMapper mapper) : IElasticDataIndexService
{
    private const string BankDatasetIndexName = "elasticvssql";
    private const string LogsIndexName = "elasticvssql_logs";

    public async Task IndexAllBankDatas()
    {
        await indexService.CreateIndex(BankDatasetIndexName);
        var datasToIndex = await sQLDataService.GetAllBankData();
        var mappedData = mapper.Map<IEnumerable<BankDatasetIndexDTO>>(datasToIndex).ToArray();

        await indexService.IndexData<BankDatasetIndexDTO>(mappedData, BankDatasetIndexName);
    }

}
