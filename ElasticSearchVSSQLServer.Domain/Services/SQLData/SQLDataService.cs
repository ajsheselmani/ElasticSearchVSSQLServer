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

    public async Task<IEnumerable<ElectronicEventsDTO>> GetAllElectronicEvents()
    {
        logger.LogInformation("Kerkese per marrje te te dhenave te datasetit te bankes nga SQLServer");
        var electronicsData = await electronicsDataRepo.GetAllAsync();
        logger.LogInformation("Marrja e te dhenave te datasetit per banka perfundoi. Numri i rekordeve: {Count}", electronicsData?.Count() ?? 0);
        return electronicsData.ToList();
    }
}