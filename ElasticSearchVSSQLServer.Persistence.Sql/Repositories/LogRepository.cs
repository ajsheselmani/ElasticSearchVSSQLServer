using AutoMapper;
using AutoMapper.QueryableExtensions;
using ElasticSearchVSSQLServer.Domain.Repositories;
using ElasticSearchVSSQLServer.Persistence.Audit;
using ElasticSearchVSSQLServer.Persistence.Sql.Context;
using Microsoft.EntityFrameworkCore;

namespace ElasticSearchVSSQLServer.Persistence.Sql.Repositories;

public class LogRepository(ApplicationDBService dbContext, IMapper mapper) : ILogRepository
{
    private readonly ApplicationDbContext _dbContext = dbContext.DbContext;

    public async Task<List<LogDTO>> GetBatchAfterIdAsync(long lastId, int batchSize)
    {
        var safeBatchSize = batchSize < 1 ? 500 : batchSize;

        return await _dbContext.Log
            .AsNoTracking()
            .Where(log => log.Id > lastId)
            .OrderBy(log => log.Id)
            .Take(safeBatchSize)
            .ProjectTo<LogDTO>(mapper.ConfigurationProvider)
            .ToListAsync();
    }
}
