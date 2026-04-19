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

        if (filters != null && filters.Count > 0)
        {
            var parameter = Expression.Parameter(typeof(T), "x");
            var predicates = new List<Expression>();

            foreach (var filter in filters)
            {
                if (string.IsNullOrWhiteSpace(filter.PropertyName))
                    continue;

                if (filter.PropertyName.Equals("globalSearch", StringComparison.OrdinalIgnoreCase))
                {
                    var globalPredicate = BuildGlobalSearchPredicate(parameter, filter);

                    if (globalPredicate != null)
                        predicates.Add(globalPredicate);

                    continue;
                }

                var prop = typeof(T).GetProperty(
                    filter.PropertyName,
                    BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);

                if (prop == null) continue;

                var member = Expression.Property(parameter, prop);
                Expression? predicate = BuildPredicate(member, prop.PropertyType, filter);

                if (predicate != null)
                    predicates.Add(predicate);
            }

            if (predicates.Count > 0)
            {
                var combined = logicType.ToLower() == "or"
                    ? predicates.Aggregate(Expression.OrElse)
                    : predicates.Aggregate(Expression.AndAlso);

                var lambda = Expression.Lambda<Func<T, bool>>(combined, parameter);
                query = query.Where(lambda);
            }
        }

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
        if (filter.Operator == "ex" || filter.Operator == "nex")
        {
            Expression check = propType.IsValueType && Nullable.GetUnderlyingType(propType) == null
                ? Expression.Constant(filter.Operator == "nex") 
                : filter.Operator == "ex"
                    ? Expression.NotEqual(member, Expression.Constant(null))
                    : Expression.Equal(member, Expression.Constant(null));
            return filter.Negate ? Expression.Not(check) : check;
        }

        if (filter.Value == null) return null;

        var underlyingType = Nullable.GetUnderlyingType(propType) ?? propType;

        object? typedValue;
        try
        {
            typedValue = underlyingType == typeof(Guid)
                ? Guid.Parse(filter.Value)
                : Convert.ChangeType(filter.Value.Trim('*'), underlyingType);
        }
        catch { return null; }

        var constant = Expression.Constant(typedValue, underlyingType);

        var left = propType != underlyingType
            ? (Expression)Expression.Convert(member, underlyingType)
            : member;

        Expression predicate = filter.Operator switch
        {
            "eq" => Expression.Equal(left, constant),
            "gt" => Expression.GreaterThan(left, constant),
            "ge" => Expression.GreaterThanOrEqual(left, constant),
            "lt" => Expression.LessThan(left, constant),
            "le" => Expression.LessThanOrEqual(left, constant),
            "like" => BuildLikePredicate(member, filter.Value, filter.CaseSensitive),
            _ => null
        };

        if (predicate == null) return null;
        return filter.Negate ? Expression.Not(predicate) : predicate;
    }

    private static Expression BuildLikePredicate(MemberExpression member, string value, bool caseSensitive)
    {
        string trimmed = value.Trim('*');

        var method = caseSensitive
            ? typeof(string).GetMethod("Contains", new[] { typeof(string) })!
            : typeof(string).GetMethod("Contains", new[] { typeof(string) })!;

        if (value.StartsWith("*") && value.EndsWith("*"))
            return Expression.Call(member, method, Expression.Constant(trimmed));

        if (value.StartsWith("*"))
        {
            var endsWith = typeof(string).GetMethod("EndsWith", new[] { typeof(string) })!;
            return Expression.Call(member, endsWith, Expression.Constant(trimmed));
        }

        if (value.EndsWith("*"))
        {
            var startsWith = typeof(string).GetMethod("StartsWith", new[] { typeof(string) })!;
            return Expression.Call(member, startsWith, Expression.Constant(trimmed));
        }

        return Expression.Call(member, method, Expression.Constant(trimmed));
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

    private Expression? BuildGlobalSearchPredicate(
    ParameterExpression parameter,
    FilterItemDto filter)
    {
        if (string.IsNullOrWhiteSpace(filter.Value))
            return null;

        var searchValue = filter.Value.Trim();
        var lowerSearchValue = searchValue.ToLower();

        Expression? combined = null;

        var properties = typeof(T)
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Where(p => p.CanRead)
            .ToList();

        foreach (var prop in properties)
        {
            var member = Expression.Property(parameter, prop);
            var propType = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;

            Expression? fieldPredicate = null;

            // string => Contains
            if (propType == typeof(string))
            {
                var notNull = Expression.NotEqual(
                    member,
                    Expression.Constant(null, typeof(string)));

                Expression memberExpression = member;
                Expression valueExpression = Expression.Constant(
                    filter.CaseSensitive ? searchValue : lowerSearchValue
                );

                if (!filter.CaseSensitive)
                {
                    var toLowerMethod = typeof(string).GetMethod(nameof(string.ToLower), Type.EmptyTypes)!;
                    memberExpression = Expression.Call(memberExpression, toLowerMethod);
                }

                var containsMethod = typeof(string).GetMethod(nameof(string.Contains), new[] { typeof(string) })!;
                var contains = Expression.Call(memberExpression, containsMethod, valueExpression);

                fieldPredicate = Expression.AndAlso(notNull, contains);
            }
            // int
            else if (propType == typeof(int) && int.TryParse(searchValue, out var intValue))
            {
                var constant = Expression.Constant(intValue, propType);
                fieldPredicate = prop.PropertyType != propType
                    ? Expression.Equal(member, Expression.Convert(constant, prop.PropertyType))
                    : Expression.Equal(member, constant);
            }
            // long
            else if (propType == typeof(long) && long.TryParse(searchValue, out var longValue))
            {
                var constant = Expression.Constant(longValue, propType);
                fieldPredicate = prop.PropertyType != propType
                    ? Expression.Equal(member, Expression.Convert(constant, prop.PropertyType))
                    : Expression.Equal(member, constant);
            }
            // decimal
            else if (propType == typeof(decimal) && decimal.TryParse(searchValue, out var decimalValue))
            {
                var constant = Expression.Constant(decimalValue, propType);
                fieldPredicate = prop.PropertyType != propType
                    ? Expression.Equal(member, Expression.Convert(constant, prop.PropertyType))
                    : Expression.Equal(member, constant);
            }
            // double
            else if (propType == typeof(double) && double.TryParse(searchValue, out var doubleValue))
            {
                var constant = Expression.Constant(doubleValue, propType);
                fieldPredicate = prop.PropertyType != propType
                    ? Expression.Equal(member, Expression.Convert(constant, prop.PropertyType))
                    : Expression.Equal(member, constant);
            }
            // Guid
            else if (propType == typeof(Guid) && Guid.TryParse(searchValue, out var guidValue))
            {
                var constant = Expression.Constant(guidValue, propType);
                fieldPredicate = prop.PropertyType != propType
                    ? Expression.Equal(member, Expression.Convert(constant, prop.PropertyType))
                    : Expression.Equal(member, constant);
            }
            // DateTime
            else if (propType == typeof(DateTime) && DateTime.TryParse(searchValue, out var dateValue))
            {
                var constant = Expression.Constant(dateValue, propType);
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
    
    public async Task<(IEnumerable<HMFashionDatasetDTO> Items, long TotalCount)> GetPagedFashionDataAsync(
        int page,
        int pageSize,
        List<ElasticSearchVSSQLServer.Domain.FilterItemDto> filters,
        string logicType)
    {
        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize < 1 ? 10 : pageSize;

        var query =
            from t in _dbContext.Set<HMdatasetTransactionsTrain>().AsNoTracking()
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
                 
                ClubMemberStatus = c.ClubMemberStatus,
                FashionNewsFrequency = c.FashionNewsFrequency,
                Age = c.Age,
                PostalCode = c.PostalCode
            };

        query = ApplyFilters(query, filters, logicType);

        var totalCount = await query.LongCountAsync();

        var items = await query
            .OrderBy(x => x.Date)
            .ThenBy(x => x.CustomerId)
            .ThenBy(x => x.ArticleId)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync();

        //return (items, totalCount);
        return (mapper.Map<IEnumerable<HMFashionDatasetDTO>>(items), totalCount);
    }

    private IQueryable<HMFashionDatasetDTO> ApplyFilters(
        IQueryable<HMFashionDatasetDTO> query,
        List<FilterItemDto> filters,
        string logicType)
    {
        if (filters == null || !filters.Any())
            return query;

        logicType = string.IsNullOrWhiteSpace(logicType) ? "and" : logicType.ToLower();

        var predicateList = new List<Expression<Func<HMFashionDatasetDTO, bool>>>();

        foreach (var filter in filters)
        {
            if (string.IsNullOrWhiteSpace(filter.PropertyName) || string.IsNullOrWhiteSpace(filter.Value))
                continue;

            var value = filter.Value.Trim().ToLower();

            switch (filter.PropertyName.ToLower())
            {
                case "customerid":
                    predicateList.Add(x => x.CustomerId != null && x.CustomerId.ToLower().Contains(value));
                    break;

                case "articleid":
                    if (int.TryParse(filter.Value, out var articleId))
                        predicateList.Add(x => x.ArticleId == articleId);
                    break;

                case "prodname":
                    predicateList.Add(x => x.ProdName != null && x.ProdName.ToLower().Contains(value));
                    break;

                case "departmentname":
                    predicateList.Add(x => x.DepartmentName != null && x.DepartmentName.ToLower().Contains(value));
                    break;

                case "indexname":
                    predicateList.Add(x => x.IndexName != null && x.IndexName.ToLower().Contains(value));
                    break;

                case "clubmemberstatus":
                    predicateList.Add(x => x.ClubMemberStatus != null && x.ClubMemberStatus.ToLower().Contains(value));
                    break;

                case "age":
                    predicateList.Add(x => x.Age != null && x.Age.ToLower().Contains(value));
                    break;

                case "globalsearch":
                    predicateList.Add(x =>
                        (x.CustomerId != null && x.CustomerId.ToLower().Contains(value)) ||
                        (x.ProdName != null && x.ProdName.ToLower().Contains(value)) ||
                        (x.ProductTypeName != null && x.ProductTypeName.ToLower().Contains(value)) ||
                        (x.ProductGroupName != null && x.ProductGroupName.ToLower().Contains(value)) ||
                        (x.DepartmentName != null && x.DepartmentName.ToLower().Contains(value)) ||
                        (x.IndexName != null && x.IndexName.ToLower().Contains(value)) ||
                        (x.SectionName != null && x.SectionName.ToLower().Contains(value)) ||
                        (x.GarmentGroupName != null && x.GarmentGroupName.ToLower().Contains(value)) ||
                        (x.ClubMemberStatus != null && x.ClubMemberStatus.ToLower().Contains(value)) ||
                        (x.PostalCode != null && x.PostalCode.ToLower().Contains(value)));
                    break;
            }
        }

        if (!predicateList.Any())
            return query;

        if (logicType == "or")
        {
            var combined = predicateList[0];
            foreach (var predicate in predicateList.Skip(1))
            {
                combined = Or(combined, predicate);
            }

            query = query.Where(combined);
        }
        else
        {
            foreach (var predicate in predicateList)
            {
                query = query.Where(predicate);
            }
        }

        return query;
    }

    private static Expression<Func<T, bool>> Or<T>(
        Expression<Func<T, bool>> left,
        Expression<Func<T, bool>> right)
    {
        var parameter = Expression.Parameter(typeof(T));

        var leftVisitor = new ReplaceExpressionVisitor(left.Parameters[0], parameter);
        var leftBody = leftVisitor.Visit(left.Body);

        var rightVisitor = new ReplaceExpressionVisitor(right.Parameters[0], parameter);
        var rightBody = rightVisitor.Visit(right.Body);

        return Expression.Lambda<Func<T, bool>>(
            Expression.OrElse(leftBody!, rightBody!),
            parameter);
    }

    private class ReplaceExpressionVisitor : ExpressionVisitor
    {
        private readonly Expression _oldValue;
        private readonly Expression _newValue;

        public ReplaceExpressionVisitor(Expression oldValue, Expression newValue)
        {
            _oldValue = oldValue;
            _newValue = newValue;
        }

        public override Expression Visit(Expression node)
        {
            if (node == _oldValue)
                return _newValue;

            return base.Visit(node);
        }
    }
}
