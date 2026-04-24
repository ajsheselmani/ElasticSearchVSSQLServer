using AutoMapper;
using AutoMapper.QueryableExtensions;
using ElasticSearchVSSQLServer.Domain;
using ElasticSearchVSSQLServer.Domain.Repositories;
using ElasticSearchVSSQLServer.Persistence.Sql.Context;
using ElasticSearchVSSQLServer.Persistence.SQLData;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Reflection;

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

    public async Task<(IEnumerable<TDto> Items, long TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        List<ElasticSearchVSSQLServer.Domain.FilterItemDto> filters,
        string logicType)
    {
        dbset = _dbContext.Set<T>();

        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize < 1 ? 10 : pageSize;

        IQueryable<T> query = dbset.AsNoTracking();
        query = ApplyDynamicFilters(query, filters, logicType);

        var totalCount = await query.LongCountAsync();
        var entities = await query
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync();

        return (mapper.Map<IEnumerable<TDto>>(entities), totalCount);
    }
    public async Task<List<TDto>> GetBatchAsync(string lastId, int batchSize)
    {
        return await _dbContext.Set<T>()
            .AsNoTracking()
            .Where(b => string.Compare(EF.Property<string>(b, "Id"), lastId) > 0)
            .OrderBy(b => EF.Property<string>(b, "Id"))
            .Take(batchSize)
            .ProjectTo<TDto>(mapper.ConfigurationProvider) 
            .ToListAsync();
    }

    private static Expression? BuildPredicate(MemberExpression member, Type propType, ElasticSearchVSSQLServer.Domain.FilterItemDto filter)
    {
        var filterOperator = string.IsNullOrWhiteSpace(filter.Operator)
            ? "eq"
            : filter.Operator.ToLowerInvariant();

        if (filterOperator == "ex" || filterOperator == "nex")
        {
            Expression check = propType.IsValueType && Nullable.GetUnderlyingType(propType) == null
                ? Expression.Constant(filterOperator == "nex")
                : filterOperator == "ex"
                    ? Expression.NotEqual(member, Expression.Constant(null))
                    : Expression.Equal(member, Expression.Constant(null));
            return filter.Negate ? Expression.Not(check) : check;
        }

        if (filter.Value == null) return null;

        var underlyingType = Nullable.GetUnderlyingType(propType) ?? propType;

        if (!TryParseFilterValue(filter.Value.Trim('*'), underlyingType, out var typedValue))
            return null;

        var constant = Expression.Constant(typedValue, underlyingType);

        var left = propType != underlyingType
            ? (Expression)Expression.Convert(member, underlyingType)
            : member;

        Expression? predicate = filterOperator switch
        {
            "eq" => Expression.Equal(left, constant),
            "gt" => Expression.GreaterThan(left, constant),
            "ge" => Expression.GreaterThanOrEqual(left, constant),
            "lt" => Expression.LessThan(left, constant),
            "le" => Expression.LessThanOrEqual(left, constant),
            "like" when underlyingType == typeof(string) => BuildLikePredicate(member, filter.Value, filter.CaseSensitive),
            _ => null
        };

        if (predicate == null) return null;
        return filter.Negate ? Expression.Not(predicate) : predicate;
    }

    private static Expression BuildLikePredicate(MemberExpression member, string value, bool caseSensitive)
    {
        string trimmed = value.Trim('*');
        var normalizedValue = caseSensitive ? trimmed : trimmed.ToLower();
        var notNull = Expression.NotEqual(member, Expression.Constant(null, typeof(string)));

        Expression memberExpression = member;
        if (!caseSensitive)
        {
            var toLowerMethod = typeof(string).GetMethod(nameof(string.ToLower), Type.EmptyTypes)!;
            memberExpression = Expression.Call(memberExpression, toLowerMethod);
        }

        MethodInfo method;
        if (value.StartsWith("*") && value.EndsWith("*"))
        {
            method = typeof(string).GetMethod(nameof(string.Contains), new[] { typeof(string) })!;
        }
        else if (value.StartsWith("*"))
        {
            method = typeof(string).GetMethod(nameof(string.EndsWith), new[] { typeof(string) })!;
        }
        else if (value.EndsWith("*"))
        {
            method = typeof(string).GetMethod(nameof(string.StartsWith), new[] { typeof(string) })!;
        }
        else
        {
            method = typeof(string).GetMethod(nameof(string.Contains), new[] { typeof(string) })!;
        }

        var comparison = Expression.Call(memberExpression, method, Expression.Constant(normalizedValue));
        return Expression.AndAlso(notNull, comparison);
    }

    //private Expression? BuildGlobalSearchPredicate(
    //ParameterExpression parameter,
    //FilterItemDto filter)
    //{
    //    if (string.IsNullOrWhiteSpace(filter.Value))
    //        return null;

    //    var searchValue = filter.Value.Trim();

    //    var allowedFields = new[]
    //    {
    //    "EventType",
    //    "ProductId",
    //    "CategoryId",
    //    "CategoryCode",
    //    "Brand",
    //    "UserId",
    //    "UserSession"
    //};

    //    Expression? combined = null;

    //    foreach (var fieldName in allowedFields)
    //    {
    //        var prop = typeof(T).GetProperty(
    //            fieldName,
    //            BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);

    //        if (prop == null)
    //            continue;

    //        var member = Expression.Property(parameter, prop);
    //        Expression? fieldPredicate = null;

    //        if (prop.PropertyType == typeof(string))
    //        {
    //            var notNull = Expression.NotEqual(
    //                member,
    //                Expression.Constant(null, typeof(string)));

    //            Expression memberExpression = member;
    //            Expression valueExpression = Expression.Constant(searchValue);

    //            if (!filter.CaseSensitive)
    //            {
    //                var toLowerMethod = typeof(string).GetMethod(nameof(string.ToLower), Type.EmptyTypes)!;
    //                memberExpression = Expression.Call(memberExpression, toLowerMethod);
    //                valueExpression = Expression.Constant(searchValue.ToLower());
    //            }

    //            var containsMethod = typeof(string).GetMethod(nameof(string.Contains), new[] { typeof(string) })!;
    //            var contains = Expression.Call(memberExpression, containsMethod, valueExpression);

    //            fieldPredicate = Expression.AndAlso(notNull, contains);
    //        }

    //        else if (prop.PropertyType == typeof(int) || prop.PropertyType == typeof(int?))
    //        {
    //            if (int.TryParse(searchValue, out var intValue))
    //            {
    //                var constant = Expression.Constant(intValue, typeof(int));

    //                fieldPredicate = prop.PropertyType == typeof(int?)
    //                    ? Expression.Equal(member, Expression.Convert(constant, typeof(int?)))
    //                    : Expression.Equal(member, constant);
    //            }
    //        }

    //        else if (prop.PropertyType == typeof(long) || prop.PropertyType == typeof(long?))
    //        {
    //            if (long.TryParse(searchValue, out var longValue))
    //            {
    //                var constant = Expression.Constant(longValue, typeof(long));

    //                fieldPredicate = prop.PropertyType == typeof(long?)
    //                    ? Expression.Equal(member, Expression.Convert(constant, typeof(long?)))
    //                    : Expression.Equal(member, constant);
    //            }
    //        }

    //        else if (prop.PropertyType == typeof(decimal) || prop.PropertyType == typeof(decimal?))
    //        {
    //            if (decimal.TryParse(searchValue, out var decimalValue))
    //            {
    //                var constant = Expression.Constant(decimalValue, typeof(decimal));

    //                fieldPredicate = prop.PropertyType == typeof(decimal?)
    //                    ? Expression.Equal(member, Expression.Convert(constant, typeof(decimal?)))
    //                    : Expression.Equal(member, constant);
    //            }
    //        }

    //        else if (prop.PropertyType == typeof(double) || prop.PropertyType == typeof(double?))
    //        {
    //            if (double.TryParse(searchValue, out var doubleValue))
    //            {
    //                var constant = Expression.Constant(doubleValue, typeof(double));

    //                fieldPredicate = prop.PropertyType == typeof(double?)
    //                    ? Expression.Equal(member, Expression.Convert(constant, typeof(double?)))
    //                    : Expression.Equal(member, constant);
    //            }
    //        }

    //        if (fieldPredicate == null)
    //            continue;

    //        combined = combined == null
    //            ? fieldPredicate
    //            : Expression.OrElse(combined, fieldPredicate);
    //    }

    //    if (combined == null)
    //        return null;

    //    return filter.Negate ? Expression.Not(combined) : combined;
    //} 

    private static Expression? BuildGlobalSearchPredicate<TEntity>(
    ParameterExpression parameter,
    FilterItemDto filter)
    {
        if (string.IsNullOrWhiteSpace(filter.Value))
            return null;

        var searchValue = filter.Value.Trim();
        Expression? combined = null;

        var properties = typeof(TEntity)
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Where(p => p.CanRead)
            .ToList();

        foreach (var prop in properties)
        {
            var member = Expression.Property(parameter, prop);
            var propType = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;

            Expression? fieldPredicate = null;

            if (propType == typeof(string))
            {
                fieldPredicate = BuildLikePredicate(member, $"*{searchValue}*", filter.CaseSensitive);
            }
            else if (IsGlobalSearchSupportedType(propType) &&
                     TryParseFilterValue(searchValue, propType, out var typedValue))
            {
                var constant = Expression.Constant(typedValue, propType);
                fieldPredicate = prop.PropertyType != propType
                    ? Expression.Equal(member, Expression.Convert(constant, prop.PropertyType))
                    : Expression.Equal(member, constant);
            }

            if (fieldPredicate == null)
                continue;

            combined = combined == null
                ? fieldPredicate
                : Expression.OrElse(combined, fieldPredicate);
        }

        if (combined == null)
            return null;

        return filter.Negate ? Expression.Not(combined) : combined;
    }

    private static IQueryable<TEntity> ApplyDynamicFilters<TEntity>(
        IQueryable<TEntity> query,
        List<FilterItemDto> filters,
        string logicType)
    {
        if (filters == null || filters.Count == 0)
            return query;

        var parameter = Expression.Parameter(typeof(TEntity), "x");
        var predicates = new List<Expression>();

        foreach (var filter in filters)
        {
            if (string.IsNullOrWhiteSpace(filter.PropertyName))
                continue;

            if (filter.PropertyName.Equals("globalSearch", StringComparison.OrdinalIgnoreCase))
            {
                var globalPredicate = BuildGlobalSearchPredicate<TEntity>(parameter, filter);

                if (globalPredicate != null)
                    predicates.Add(globalPredicate);

                continue;
            }

            var prop = typeof(TEntity).GetProperty(
                filter.PropertyName,
                BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);

            if (prop == null)
                continue;

            var member = Expression.Property(parameter, prop);
            var predicate = BuildPredicate(member, prop.PropertyType, filter);

            if (predicate != null)
                predicates.Add(predicate);
        }

        if (predicates.Count == 0)
            return query;

        var combined = string.Equals(logicType, "or", StringComparison.OrdinalIgnoreCase)
            ? predicates.Aggregate(Expression.OrElse)
            : predicates.Aggregate(Expression.AndAlso);

        var lambda = Expression.Lambda<Func<TEntity, bool>>(combined, parameter);
        return query.Where(lambda);
    }

    private static bool TryParseFilterValue(string rawValue, Type targetType, out object? typedValue)
    {
        typedValue = null;

        if (targetType == typeof(string))
        {
            typedValue = rawValue;
            return true;
        }

        if (targetType == typeof(Guid))
        {
            if (!Guid.TryParse(rawValue, out var guidValue))
                return false;

            typedValue = guidValue;
            return true;
        }

        if (targetType == typeof(DateOnly))
        {
            if (!DateOnly.TryParse(rawValue, out var dateOnlyValue))
                return false;

            typedValue = dateOnlyValue;
            return true;
        }

        if (targetType == typeof(DateTime))
        {
            if (!DateTime.TryParse(rawValue, out var dateTimeValue))
                return false;

            typedValue = dateTimeValue;
            return true;
        }

        if (targetType == typeof(bool))
        {
            if (!bool.TryParse(rawValue, out var boolValue))
                return false;

            typedValue = boolValue;
            return true;
        }

        try
        {
            typedValue = Convert.ChangeType(rawValue, targetType);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static bool IsGlobalSearchSupportedType(Type propType)
        => propType == typeof(int)
        || propType == typeof(long)
        || propType == typeof(short)
        || propType == typeof(byte)
        || propType == typeof(decimal)
        || propType == typeof(double)
        || propType == typeof(float)
        || propType == typeof(Guid)
        || propType == typeof(DateTime)
        || propType == typeof(DateOnly)
        || propType == typeof(bool);
    
    public async Task<(IEnumerable<HMFashionDatasetDTO> Items, long TotalCount)> GetPagedFashionDataAsync(
        int page,
        int pageSize,
        List<ElasticSearchVSSQLServer.Domain.FilterItemDto> filters,
        string logicType)
    {
        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize < 1 ? 10 : pageSize;
        var baseTransactionsQuery = _dbContext.Set<HMdatasetTransactionsTrain>().AsNoTracking();
        if (!HasActiveFilters(filters))
        {
            var totalCount = await baseTransactionsQuery.LongCountAsync();
            var pageTransactions = await baseTransactionsQuery
                .OrderBy(t => t.Date)
                .ThenBy(t => t.CustomerId)
                .ThenBy(t => t.ArticleId)
                .Skip((safePage - 1) * safePageSize)
                .Take(safePageSize)
                .Select(t => new
                {
                    t.Date,
                    t.CustomerId,
                    t.ArticleId,
                    t.Price,
                    t.SalesChannelId
                })
                .ToListAsync();

            var articleIds = pageTransactions
                .Select(t => t.ArticleId)
                .Distinct()
                .ToList();

            var customerIds = pageTransactions
                .Select(t => t.CustomerId)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct()
                .ToList();

            var articles = await _dbContext.Set<HMdatasetArticles>()
                .AsNoTracking()
                .Where(article => articleIds.Contains(article.Id))
                .ToDictionaryAsync(article => article.Id);

            var customers = await _dbContext.Set<HMdatasetCustomers>()
                .AsNoTracking()
                .Where(customer => customerIds.Contains(customer.Id))
                .ToDictionaryAsync(customer => customer.Id);

            var items = pageTransactions.Select(transaction =>
            {
                articles.TryGetValue(transaction.ArticleId, out var article);
                customers.TryGetValue(transaction.CustomerId, out var customer);

                return new HMFashionDatasetDTO
                {
                    Date = transaction.Date,
                    CustomerId = transaction.CustomerId,
                    ArticleId = transaction.ArticleId,
                    Price = transaction.Price,
                    SalesChannelId = transaction.SalesChannelId,
                    ProductCode = article?.ProductCode ?? 0,
                    ProdName = article?.ProdName ?? string.Empty,
                    ProductTypeName = article?.ProductTypeName ?? string.Empty,
                    ProductGroupName = article?.ProductGroupName ?? string.Empty,
                    GraphicalAppearanceName = article?.GraphicalAppearanceName ?? string.Empty,
                    ColourGroupName = article?.ColourGroupName ?? string.Empty,
                    PerceivedColourValueName = article?.PerceivedColourValueName ?? string.Empty,
                    DepartmentName = article?.DepartmentName ?? string.Empty,
                    IndexName = article?.IndexName ?? string.Empty,
                    IndexGroupName = article?.IndexGroupName ?? string.Empty,
                    SectionName = article?.SectionName ?? string.Empty,
                    GarmentGroupName = article?.GarmentGroupName ?? string.Empty,
                    DetailDesc = article?.DetailDesc ?? string.Empty,
                    Fn = customer?.Fn ?? string.Empty,
                    Active = customer?.Active ?? string.Empty,
                    ClubMemberStatus = customer?.ClubMemberStatus ?? string.Empty,
                    FashionNewsFrequency = customer?.FashionNewsFrequency ?? string.Empty,
                    Age = customer?.Age ?? string.Empty,
                    PostalCode = customer?.PostalCode ?? string.Empty
                };
            }).ToList();

            return (items, totalCount);
        }

        var query = BuildHMFashionProjection(baseTransactionsQuery);
        if (HasActiveFilters(filters))
        {
            query = ApplyDynamicFilters(query, filters, logicType);
        }

        var filteredTotalCount = await query.LongCountAsync();
        var pageItems = await query
            .OrderBy(x => x.Date)
            .ThenBy(x => x.CustomerId)
            .ThenBy(x => x.ArticleId)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync();

        return (pageItems, filteredTotalCount);
    }

    private IQueryable<HMFashionDatasetDTO> BuildHMFashionProjection(IQueryable<HMdatasetTransactionsTrain> transactionsQuery)
        =>
            from t in transactionsQuery
            join a in _dbContext.Set<HMdatasetArticles>().AsNoTracking()
                on t.ArticleId equals a.Id
            join c in _dbContext.Set<HMdatasetCustomers>().AsNoTracking()
                on t.CustomerId equals c.Id
            select new HMFashionDatasetDTO
            {
                Date = t.Date,
                CustomerId = t.CustomerId,
                ArticleId = t.ArticleId,
                Price = t.Price,
                SalesChannelId = t.SalesChannelId,

                ProductCode = a.ProductCode,
                ProdName = a.ProdName,
                ProductTypeName = a.ProductTypeName,
                ProductGroupName = a.ProductGroupName,
                GraphicalAppearanceName = a.GraphicalAppearanceName,
                ColourGroupName = a.ColourGroupName,
                PerceivedColourValueName = a.PerceivedColourValueName,
                DepartmentName = a.DepartmentName,
                IndexName = a.IndexName,
                IndexGroupName = a.IndexGroupName,
                SectionName = a.SectionName,
                GarmentGroupName = a.GarmentGroupName,
                DetailDesc = a.DetailDesc,

                Fn = c.Fn,
                Active = c.Active,
                ClubMemberStatus = c.ClubMemberStatus,
                FashionNewsFrequency = c.FashionNewsFrequency,
                Age = c.Age,
                PostalCode = c.PostalCode
            };

    private static bool HasActiveFilters(List<FilterItemDto> filters)
        => filters != null
           && filters.Any(filter =>
               !string.IsNullOrWhiteSpace(filter.PropertyName)
               && (filter.PropertyName.Equals("globalSearch", StringComparison.OrdinalIgnoreCase)
                   || filter.Operator is "ex" or "nex"
                   || !string.IsNullOrWhiteSpace(filter.Value)));
}
