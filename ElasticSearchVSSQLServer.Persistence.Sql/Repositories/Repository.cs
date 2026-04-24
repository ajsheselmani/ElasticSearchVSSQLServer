using ElasticSearchVSSQLServer.Domain.Repositories;
using ElasticSearchVSSQLServer.Persistence.Sql.Context;
using ElasticSearchVSSQLServer.Domain;
using ElasticSearchVSSQLServer.Persistence.SQLData;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Reflection;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Persistence.Sql.Repositories;

public class Repository(ApplicationDBService dbContextService) : IRepository
{
    public async Task<List<HMFashionDatasetDTO>> GetHMFashionFlatBatch(
        DateOnly? lastDate,
        string lastCustomerId,
        int? lastArticleId,
        double? lastPrice,
        byte? lastSalesChannelId,
        int batchSize)
    {
        var transactions = dbContextService.DbContext.HMdatasetTransactionsTrain.AsNoTracking();

        if (lastDate.HasValue)
        {
            var customerId = lastCustomerId ?? string.Empty;
            var articleId = lastArticleId ?? 0;
            var price = lastPrice ?? 0d;
            var salesChannelId = lastSalesChannelId ?? 0;

            transactions = transactions.Where(t =>
                t.Date > lastDate.Value ||
                (t.Date == lastDate.Value && string.Compare(t.CustomerId, customerId) > 0) ||
                (t.Date == lastDate.Value && t.CustomerId == customerId && t.ArticleId > articleId) ||
                (t.Date == lastDate.Value && t.CustomerId == customerId && t.ArticleId == articleId && (t.Price ?? 0d) > price) ||
                (t.Date == lastDate.Value && t.CustomerId == customerId && t.ArticleId == articleId && (t.Price ?? 0d) == price && (t.SalesChannelId ?? 0) > salesChannelId));
        }

        var query = from t in transactions
                    join c in dbContextService.DbContext.HMdatasetCustomers.AsNoTracking() on t.CustomerId equals c.Id
                    join a in dbContextService.DbContext.HMdatasetArticles.AsNoTracking() on t.ArticleId equals a.Id
                    orderby t.Date, t.CustomerId, t.ArticleId, (t.Price ?? 0d), (t.SalesChannelId ?? 0)
                    select new HMFashionFlatSqlRow
                    {
                        Date = t.Date,
                        Price = t.Price ?? 0,
                        SalesChannelId = t.SalesChannelId,
                        CustomerId = t.CustomerId,
                        Fn = c.Fn,
                        Active = c.Active,
                        Age = c.Age,
                        ClubMemberStatus = c.ClubMemberStatus,
                        FashionNewsFrequency = c.FashionNewsFrequency,
                        PostalCode = c.PostalCode,
                        ArticleId = t.ArticleId,
                        ProdName = a.ProdName,
                        ProductTypeName = a.ProductTypeName,
                        ProductGroupName = a.ProductGroupName,
                        ColourGroupName = a.ColourGroupName,
                        DepartmentName = a.DepartmentName,
                        IndexName = a.IndexName,
                        IndexGroupName = a.IndexGroupName,
                        SectionName = a.SectionName,
                        GarmentGroupName = a.GarmentGroupName,
                        DetailDesc = a.DetailDesc,
                        ProductCode = a.ProductCode,
                        GraphicalAppearanceName = a.GraphicalAppearanceName,
                        PerceivedColourValueName = a.PerceivedColourValueName,
                    };

        var records = await EntityFrameworkQueryableExtensions.ToListAsync(query.Take(batchSize));

        if (records.Count == batchSize)
        {
            var lastRecord = records.Last();
            var recordsWithLastKey = records.Count(x => HasSameTransactionKey(x, lastRecord));

            var allRecordsWithLastKey = await EntityFrameworkQueryableExtensions.ToListAsync(
                query.Where(x =>
                    x.Date == lastRecord.Date &&
                    x.CustomerId == lastRecord.CustomerId &&
                    x.ArticleId == lastRecord.ArticleId &&
                    (x.Price ?? 0d) == (lastRecord.Price ?? 0d) &&
                    (x.SalesChannelId ?? 0) == (lastRecord.SalesChannelId ?? 0)));

            records.AddRange(allRecordsWithLastKey.Skip(recordsWithLastKey));
        }

        return records.Select(x => new HMFashionDatasetDTO
        {
            Date = x.Date,
            Price = x.Price,
            SalesChannelId = x.SalesChannelId,
            CustomerId = x.CustomerId,
            Fn = x.Fn,
            Active = x.Active,
            Age = x.Age ?? "0",
            ClubMemberStatus = x.ClubMemberStatus,
            FashionNewsFrequency = x.FashionNewsFrequency,
            PostalCode = x.PostalCode,
            ArticleId = x.ArticleId,
            ProdName = x.ProdName,
            ProductTypeName = x.ProductTypeName,
            ProductGroupName = x.ProductGroupName,
            ColourGroupName = x.ColourGroupName,
            DepartmentName = x.DepartmentName,
            IndexName = x.IndexName,
            IndexGroupName = x.IndexGroupName,
            SectionName = x.SectionName,
            GarmentGroupName = x.GarmentGroupName,
            DetailDesc = x.DetailDesc,
            ProductCode = x.ProductCode,
            PerceivedColourValueName = x.PerceivedColourValueName,
            GraphicalAppearanceName = x.GraphicalAppearanceName
        }).ToList();
    }

    private static bool HasSameTransactionKey(HMFashionFlatSqlRow first, HMFashionFlatSqlRow second)
    {
        return first.Date == second.Date &&
               first.CustomerId == second.CustomerId &&
               first.ArticleId == second.ArticleId &&
               (first.Price ?? 0d) == (second.Price ?? 0d) &&
               (first.SalesChannelId ?? 0) == (second.SalesChannelId ?? 0);
    }

    private class HMFashionFlatSqlRow
    {
        public int ArticleId { get; set; }
        public int ProductCode { get; set; }
        public string ProdName { get; set; }
        public string ProductTypeName { get; set; }
        public string ProductGroupName { get; set; }
        public string GraphicalAppearanceName { get; set; }
        public string ColourGroupName { get; set; }
        public string PerceivedColourValueName { get; set; }
        public string DepartmentName { get; set; }
        public string IndexName { get; set; }
        public string IndexGroupName { get; set; }
        public string SectionName { get; set; }
        public string GarmentGroupName { get; set; }
        public string DetailDesc { get; set; }

        public string CustomerId { get; set; }
        public string Fn { get; set; }
        public string Active { get; set; }
        public string ClubMemberStatus { get; set; }
        public string FashionNewsFrequency { get; set; }
        public string Age { get; set; }
        public string PostalCode { get; set; }

        public double? Price { get; set; }
        public byte? SalesChannelId { get; set; }
        public DateOnly Date { get; set; }
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

    private static Expression? BuildPredicate(MemberExpression member, Type propType, FilterItemDto filter)
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

        if (filter.Value == null)
            return null;

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

        if (predicate == null)
            return null;

        return filter.Negate ? Expression.Not(predicate) : predicate;
    }

    private static Expression BuildLikePredicate(MemberExpression member, string value, bool caseSensitive)
    {
        var trimmed = value.Trim('*');
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
}
