using ElasticSearchVSSQLServer.Persistence.SQLData;
using Microsoft.AspNetCore.Mvc.Filters;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Domain.Services.SQLData;
public interface ISQLDataService
{
    Task<IEnumerable<BankDatasetDTO>> GetAllBankData();
    //Task<List<ElectronicEventsDTO>> GetElectronicsBatch(string lastId, int batchSize);
    Task<IEnumerable<ElectronicEventsDTO>> GetAllElectronicEvents();
    Task<(IEnumerable<HMFashionDatasetDTO> Items, long TotalCount)> GetHMFashionData(
        int page,
        int pageSize,
        List<FilterItemDto> filters,
        string logicType);
    Task<(IEnumerable<ElectronicEventsDTO> Items, long TotalCount)> GetElectronicEvents(int page, int pageSize, List<FilterItemDto> filters, string logicType);
    Task<List<BankDatasetDTO>> GetBankBatch(string lastId, int batchSize);
    Task<List<HMFashionDatasetDTO>> GetHMFashionFlatBatch(DateOnly? lastDate, string lastCustomerId, int? lastArticleId, int batchSize);
}