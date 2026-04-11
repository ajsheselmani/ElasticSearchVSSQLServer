using AutoMapper;
using AutoMapper.QueryableExtensions;
using ElasticSearchVSSQLServer.Domain.Repositories;
using ElasticSearchVSSQLServer.Persistence.Sql.Context;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace ElasticSearchVSSQLServer.Persistence.Sql.Repositories;

public class GenericRepository<T, TDto, Tid>(ApplicationDBService dbContext, IMapper mapper) : IGenericRepository<TDto, Tid> where T : class where TDto : class {
    private ApplicationDbContext _dbContext = dbContext.DbContext;
    private DbSet<T> dbset;

    public async Task<TDto> AddAsync(TDto dtoEntity) {
        dbset = _dbContext.Set<T>();
        var itemToAdd = mapper.Map<T>(dtoEntity);
        await dbset.AddAsync(itemToAdd);
        await _dbContext.SaveChangesAsync();
        return mapper.Map<TDto>(itemToAdd);
    }

    public async Task<IEnumerable<TDto>> GetAllAsync() {
        dbset = _dbContext.Set<T>();
        var itemsToGet = await dbset.ToListAsync();
        return mapper.Map<IEnumerable<TDto>>(itemsToGet);
    }

    public async Task<TDto> GetByIdAsync(Tid id) {
        dbset = _dbContext.Set<T>();
        var itemToGet = await dbset.FindAsync(id);
        return mapper.Map<TDto>(itemToGet);
    }

    public async Task<TDto> UpdateAsync(Tid id, TDto dtoEntity) {
        dbset = _dbContext.Set<T>();
        var itemToUpdate = await dbset.FindAsync(id);
        mapper.Map(dtoEntity, itemToUpdate);
        await _dbContext.SaveChangesAsync();
        return mapper.Map<TDto>(itemToUpdate);
    }
    public void ClearChangeTracker() {
        _dbContext.ChangeTracker.Clear();
    }
    
    public async Task DeleteAsync(Tid id) {
        dbset = _dbContext.Set<T>();
        var entity = await dbset.FindAsync(id);
        if (entity != null)
        {
            dbset.Remove(entity);
            await _dbContext.SaveChangesAsync();
        }
    }
    public async Task<IEnumerable<TDto>> GetByConditionAsync(Expression<Func<TDto, bool>> predicate)
    {
        var query = _dbContext.Set<T>().ProjectTo<TDto>(mapper.ConfigurationProvider);

        var itemsToGet = await query.Where(predicate).ToListAsync();
        return itemsToGet;
    }
    public async Task<IEnumerable<TDto>> GetByIdsAsync(IEnumerable<Tid> ids) {
        dbset = _dbContext.Set<T>();

        var entityType = dbset.EntityType.FindPrimaryKey()?.Properties.FirstOrDefault();
        if (entityType == null)
            throw new InvalidOperationException("Primary key not found.");

        var keyProperty = typeof(T).GetProperty(entityType.Name);
        if (keyProperty == null)
            throw new InvalidOperationException("Key property not found on the entity.");

        var parameter = Expression.Parameter(typeof(T), "x");

        var propertyAccess = Expression.Property(parameter, keyProperty);

        var idsConstant = Expression.Constant(ids);
        var containsMethod = typeof(Enumerable).GetMethods()
            .First(m => m.Name == "Contains" && m.GetParameters().Length == 2)
            .MakeGenericMethod(typeof(Tid));

        var body = Expression.Call(null, containsMethod, idsConstant, propertyAccess);

        var predicate = Expression.Lambda<Func<T, bool>>(body, parameter);

        var itemToGet = await dbset.Where(predicate).ToListAsync();

        return mapper.Map<IEnumerable<TDto>>(itemToGet);
    }

    public async Task<IEnumerable<TDto>> AddRangeAsync(IEnumerable<TDto> dtoEntities)
    {
        var itemsToAdd = mapper.Map<IEnumerable<T>>(dtoEntities);
        await dbset.AddRangeAsync(itemsToAdd);
        await _dbContext.SaveChangesAsync();
        return mapper.Map<IEnumerable<TDto>>(itemsToAdd);
    }

    public async Task<(IEnumerable<TDto> Items, long TotalCount)> GetPagedAsync(int page, int pageSize)
    {
        dbset = _dbContext.Set<T>();

        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize < 1 ? 10 : pageSize;

        var totalCount = await dbset.LongCountAsync();
        var entities = await dbset
            .AsNoTracking()
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync();

        return (mapper.Map<IEnumerable<TDto>>(entities), totalCount);
    }
}
