namespace ElasticSearchVSSQLServer.Persistence.Sql.Context;
using Microsoft.EntityFrameworkCore;

public class ApplicationDBService : IDisposable, IAsyncDisposable
{
    private readonly ApplicationDbContext _dbContext;

    public ApplicationDBService(IDbContextFactory<ApplicationDbContext> dbContextFactory)
    {
        _dbContext = dbContextFactory.CreateDbContext();
    }

    public ApplicationDbContext DbContext => _dbContext;

    public void Dispose()
    {
        _dbContext.Dispose();
    }

    public ValueTask DisposeAsync()
    {
        return _dbContext.DisposeAsync();
    }
}