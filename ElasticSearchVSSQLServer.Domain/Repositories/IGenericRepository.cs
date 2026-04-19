using ElasticSearchVSSQLServer.Persistence.SQLData;
using Microsoft.AspNetCore.Mvc.Filters;
using PdfSharp;
using PdfSharp.Pdf.Filters;
using System.Linq.Expressions;

namespace ElasticSearchVSSQLServer.Domain.Repositories;

//public class FilterItemDto
//{
//    public string PropertyName { get; set; } = string.Empty;
//    public string Operator { get; set; } = string.Empty;
//    public string? Value { get; set; }
//    public bool Negate { get; set; }
//    public bool CaseSensitive { get; set; }
//}
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

    Task<(IEnumerable<TDto> Items, long TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        List<FilterItemDto> filters,
        string logicType);
    Task<List<TDto>> GetBatchAsync(string lastId, int batchSize);
    Task<(IEnumerable<HMFashionDatasetDTO> Items, long TotalCount)> GetPagedFashionDataAsync(
        int page,
        int pageSize,
        List<FilterItemDto> filters,
        string logicType);
}
