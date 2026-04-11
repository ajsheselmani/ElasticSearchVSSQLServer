using System.Linq.Expressions;

namespace ElasticSearchVSSQLServer.Domain.Repositories;

public interface IGenericRepository<TDto, Tid> where TDto : class {
    Task<TDto> GetByIdAsync(Tid id);

    Task<IEnumerable<TDto>> GetAllAsync();

    Task<TDto> AddAsync(TDto dtoEntity);

    Task<TDto> UpdateAsync(Tid id, TDto dtoEntity);

    void ClearChangeTracker();
    Task DeleteAsync(Tid id);

    Task<IEnumerable<TDto>> GetByIdsAsync(IEnumerable<Tid> ids);
    Task<IEnumerable<TDto>> AddRangeAsync(IEnumerable<TDto> dtoEntities);
    Task<IEnumerable<TDto>> GetByConditionAsync(Expression<Func<TDto, bool>> predicate);

    Task<(IEnumerable<TDto> Items, long TotalCount)> GetPagedAsync(int page, int pageSize);
}
