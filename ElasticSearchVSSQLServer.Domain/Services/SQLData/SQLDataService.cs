using ElasticSearchVSSQLServer.Domain.Repositories;
using ElasticSearchVSSQLServer.Persistence.SQLData;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Domain.Services.SQLData;
public class SQLDataService(IGenericRepository<HMTransactionsTrainDTO, int> hmTransactionsTrainDataRepo, IGenericRepository<ElectronicEventsDTO, int> electronicsDataRepo, IRepository repository, ILogger<SQLDataService> logger) : ISQLDataService
{
    public async Task<(IEnumerable<HMFashionDatasetDTO> Items, long TotalCount)> GetHMFashionData(
        int page,
        int pageSize,
        List<FilterItemDto> filters,
        string logicType)
    {
        logger.LogInformation("Kerkese per marrje te te dhenave te datasetit HM Fashion nga SQL Server");

        var result = await hmTransactionsTrainDataRepo.GetPagedFashionDataAsync(page, pageSize, filters, logicType);

        logger.LogInformation(
            "Marrja e te dhenave te datasetit HM Fashion perfundoi. Rekorde ne faqe: {Count}, Total: {TotalCount}",
            result.Items.Count(),
            result.TotalCount);

        //return result.Items.ToList();
        return result;
    }

    public async Task<IEnumerable<ElectronicEventsDTO>> GetAllElectronicEvents()
    {
        logger.LogInformation("Kerkese per marrje te te dhenave te datasetit elektronik nga SQLServer");
        var electronicsData = await electronicsDataRepo.GetAllAsync();
        logger.LogInformation("Marrja e te dhenave te datasetit elektronik perfundoi. Numri i rekordeve: {Count}", electronicsData?.Count() ?? 0);
        return electronicsData.ToList();
    }

    public async Task<(IEnumerable<ElectronicEventsDTO> Items, long TotalCount)> GetElectronicEvents(
        int page, 
        int pageSize,
        List<FilterItemDto> filters,
        string logicType
    ){
        logger.LogInformation("Kerkese per marrje te te dhenave te datasetit te elektronikes nga SQLServer");
        var electronicsData = await electronicsDataRepo.GetPagedAsync(page, pageSize, filters, logicType);
        logger.LogInformation("Marrja e te dhenave te datasetit per elektronike perfundoi. Rekorde ne faqe: {Count}, Total: {TotalCount}", electronicsData.Items?.Count() ?? 0, electronicsData.TotalCount);
        return electronicsData;
    }

    public async Task<List<HMFashionDatasetDTO>> GetHMFashionFlatBatch(
        DateOnly? lastDate,
        string lastCustomerId,
        int? lastArticleId,
        double? lastPrice,
        byte? lastSalesChannelId,
        int batchSize)
    {
        return await repository.GetHMFashionFlatBatch(lastDate, lastCustomerId, lastArticleId, lastPrice, lastSalesChannelId, batchSize);
    }
}
