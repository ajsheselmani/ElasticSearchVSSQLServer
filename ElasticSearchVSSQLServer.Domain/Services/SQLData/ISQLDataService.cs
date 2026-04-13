using ElasticSearchVSSQLServer.Persistence.SQLData;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Domain.Services.SQLData;
public interface ISQLDataService
{
    Task<IEnumerable<BankDatasetDTO>> GetAllBankData();
    Task<IEnumerable<ElectronicEventsDTO>> GetAllElectronicEvents();
    Task<(IEnumerable<BankDatasetDTO> items, long TotalCount)> GetBankData(int page, int pageSize);
    Task<(IEnumerable<ElectronicEventsDTO> Items, long TotalCount)> GetElectronicEvents(int page, int pageSize);
    Task<List<BankDatasetDTO>> GetBankBatch(string lastId, int batchSize);
    Task<List<HMFashionDatasetDTO>> GetHMFashionFlatBatch(DateOnly? lastDate, string lastCustomerId, int? lastArticleId, int batchSize);
}