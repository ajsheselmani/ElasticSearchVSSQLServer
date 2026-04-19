using AutoMapper;
using ElasticSearchVSSQLServer.Domain.Services.Audit;
using ElasticSearchVSSQLServer.Domain.Services.SQLData;
using ElasticSearchVSSQLServer.Indexing.Models.BankDataset;
using ElasticSearchVSSQLServer.Indexing.Models.Datasets;
using ElasticSearchVSSQLServer.Indexing.Models.LogsIndexed;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Services;

public class ElasticDataIndexService(IIndexService indexService, ISQLDataService sQLDataService, ILogService logsService, IMapper mapper) : IElasticDataIndexService
{
    private const string ElectronicsDatasetIndexName = "elasticvssql_electronics";
    private const string LogsIndexName = "elasticvssql_logs";

    public async Task IndexAllBankDatas()
    {
        await indexService.CreateIndex(LogsIndexName);
        var datasToIndex = await sQLDataService.GetAllBankData();
        var mappedData = mapper.Map<IEnumerable<BankDatasetIndexDTO>>(datasToIndex).ToArray();

        await indexService.IndexData<BankDatasetIndexDTO>(mappedData, LogsIndexName);
    }

    public async Task IndexAllElectronicsDatas()
    {
        //await indexService.CreateIndex(ElectronicsDatasetIndexName);
        var datasToIndex = await sQLDataService.GetAllElectronicEvents();

        var mappedData = mapper.Map<IEnumerable<ElectronicsDatasetIndexDTO>>(datasToIndex).ToArray();

        await indexService.IndexDataBulk<ElectronicsDatasetIndexDTO>(mappedData, ElectronicsDatasetIndexName);
    }

}
