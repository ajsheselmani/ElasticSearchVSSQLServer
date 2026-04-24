using ElasticSearchVSSQLServer.Persistence.SQLData;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Domain.Repositories;

public interface IRepository
{
    Task<List<HMFashionDatasetDTO>> GetHMFashionFlatBatch(
        DateOnly? lastDate,
        string lastCustomerId,
        int? lastArticleId,
        double? lastPrice,
        byte? lastSalesChannelId,
        int batchSize);

};
