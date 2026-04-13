using ElasticSearchVSSQLServer.Domain.Repositories;
using ElasticSearchVSSQLServer.Persistence.SQLData;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Domain.Services.SQLData;
public class SQLDataService(IGenericRepository<BankDatasetDTO, int> bankDataRepo, IGenericRepository<ElectronicEventsDTO, int> electronicsDataRepo, ILogger<SQLDataService> logger) : ISQLDataService
{
    public async Task<IEnumerable<BankDatasetDTO>> GetAllBankData()
    {
        logger.LogInformation("Kerkese per marrje te te dhenave te datasetit te bankes nga SQLServer");
        var banksData = await bankDataRepo.GetAllAsync();
        logger.LogInformation("Marrja e te dhenave te datasetit per banka perfundoi. Numri i rekordeve: {Count}", banksData?.Count() ?? 0);
        return banksData.ToList();
    }

    public async Task<(IEnumerable<BankDatasetDTO> items, long TotalCount)> GetBankData(int page, int pageSize)
    {
        logger.LogInformation("Kerkese per marrje te te dhenave te datasetit te bankes nga SQLServer");
        var banksData = await bankDataRepo.GetPagedAsync(page, pageSize);
        logger.LogInformation("Marrja e te dhenave te datasetit per banka perfundoi.  Rekorde ne faqe: {Count}, Total: {TotalCount}", banksData.Items?.Count() ?? 0, banksData.TotalCount);
        return banksData;
    }

    public async Task<IEnumerable<ElectronicEventsDTO>> GetAllElectronicEvents()
    {
        logger.LogInformation("Kerkese per marrje te te dhenave te datasetit elektronik nga SQLServer");
        var electronicsData = await electronicsDataRepo.GetAllAsync();
        logger.LogInformation("Marrja e te dhenave te datasetit elektronik perfundoi. Numri i rekordeve: {Count}", electronicsData?.Count() ?? 0);
        return electronicsData.ToList();
    }

    public async Task<(IEnumerable<ElectronicEventsDTO> Items, long TotalCount)> GetElectronicEvents(int page, int pageSize)
    {
        logger.LogInformation("Kerkese per marrje te te dhenave te datasetit te bankes nga SQLServer");
        var electronicsData = await electronicsDataRepo.GetPagedAsync(page, pageSize);
        logger.LogInformation("Marrja e te dhenave te datasetit per banka perfundoi. Rekorde ne faqe: {Count}, Total: {TotalCount}", electronicsData.Items?.Count() ?? 0, electronicsData.TotalCount);
        return electronicsData;
    }

    public async Task<List<BankDatasetDTO>> GetBankBatch(string lastId, int batchSize)
    {
        var data = await bankDataRepo.GetBatchAsync(lastId, batchSize);

        return data.Select(b => new BankDatasetDTO
        {
            Id = b.Id,
            Date = b.Date,
            Location = b.Location,
            TransactionCount = b.TransactionCount,
            Domain = b.Domain,
            Value = b.Value,
        }).ToList();
    }
}