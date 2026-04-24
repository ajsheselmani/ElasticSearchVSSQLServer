using ElasticSearchVSSQLServer.Persistence.Audit;

namespace ElasticSearchVSSQLServer.Domain.Repositories;

public interface ILogRepository
{
    Task<List<LogDTO>> GetBatchAfterIdAsync(long lastId, int batchSize);
}
