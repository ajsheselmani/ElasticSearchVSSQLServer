using AutoMapper;
using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.Aggregations;
using Elastic.Clients.Elasticsearch.Mapping;
using Elastic.Clients.Elasticsearch.QueryDsl;
using Elastic.Transport.Extensions;
using ElasticSearchVSSQLServer.Domain.Services.Audit;
using ElasticSearchVSSQLServer.Indexing.Configuration;
using ElasticSearchVSSQLServer.Indexing.Models;
using ElasticSearchVSSQLServer.Indexing.Models.Enums;
using ElasticSearchVSSQLServer.Indexing.Models.LogsIndexed;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Reflection;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Services;

public class IndexService(IOptions<ElasticConfiguration> config, IMapper mapper, ILogService logService, ElasticsearchClient elasticsearchClient) : ElasticClient(config, elasticsearchClient), IIndexService
{
    private static readonly Dictionary<string, string> FieldAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["formContent"] = "fromContent"
    };

    public async Task IndexData<T>(T[] data, string index) where T : class
    {
        var client = getElasticClient(index);

        var existsResponse = await client.Indices.ExistsAsync(index);
        if (!existsResponse.Exists)
        {
            var createResponse = await client.Indices.CreateAsync(index, x => x.Settings(s => s.MaxResultWindow(10000000)));
            if (!createResponse.IsValidResponse)
            {
                throw new Exception($"Failed to create index '{index}'. Error: {createResponse.ElasticsearchServerError?.Error?.Reason}");
            }
        }
        if (data != null && data.Any())
        {
            var bulkResponse = await client.BulkAsync(b => b
                .Index(index)
                .IndexMany(data)
            );

            if (!bulkResponse.IsValidResponse || bulkResponse.Errors)
            {
                var itemErrors = bulkResponse.ItemsWithErrors?
                    .Select(x => $"Id: {x.Id}, Error: {x.Error?.Reason}")
                    .ToList();

                var errorMessage = itemErrors != null && itemErrors.Any()
                    ? string.Join(" | ", itemErrors)
                    : bulkResponse.ElasticsearchServerError?.Error?.Reason ?? "Unknown bulk error";

                throw new Exception($"Bulk indexing failed. Details: {errorMessage}");
            }

            if (!bulkResponse.IsValidResponse || bulkResponse.Errors)
                throw new Exception("Bulk indexing failed.");

            await client.Indices.RefreshAsync(index);
        }
    }

    public async Task IndexDataBulk<T>(T[] data, string index) where T : class
    {
        var client = getElasticClient(index);

        var existsResponse = await client.Indices.ExistsAsync(index);
        if (!existsResponse.Exists)
        {
            var createResponse = await client.Indices.CreateAsync(index, x => x
                .Settings(s => s.MaxResultWindow(1000000))
            );

            if (!createResponse.IsValidResponse)
            {
                throw new Exception($"Failed to create index '{index}'. Error: {createResponse.ElasticsearchServerError?.Error?.Reason}");
            }
        }

        if (data == null || !data.Any())
            return;

        const int batchSize = 500;

        for (int i = 0; i < data.Length; i += batchSize)
        {
            var batch = data.Skip(i).Take(batchSize).ToArray();

            var bulkResponse = await client.BulkAsync(b => b
                .Index(index)
                .IndexMany(batch)
            );

            if (!bulkResponse.IsValidResponse || bulkResponse.Errors)
            {
                var itemErrors = bulkResponse.ItemsWithErrors?
                    .Select(x => $"Id: {x.Id}, Type: {x.Error?.Type}, Reason: {x.Error?.Reason}")
                    .ToList();

                var details = itemErrors != null && itemErrors.Any()
                    ? string.Join(Environment.NewLine, itemErrors)
                    : bulkResponse.ElasticsearchServerError?.Error?.Reason ?? "Unknown bulk error";

                throw new Exception($"Bulk indexing failed in batch starting at {i}. Details: {details}");
            }
        }

        await client.Indices.RefreshAsync(index);
    }

    public async Task<PaginatedSearchResponse<TQueryModel>> Search<TQueryModel>(int? page,
           int? pageSize,
           string? query,
           SearchParams searchParams, string indexName) where TQueryModel : class
    {
        if (query == "null")
            query = null;
        var client = getElasticClient(indexName);

        var properties = GetIndexProperties(client, indexName);

        SortOptions[] fieldsSort = setSorting(searchParams?.sortOrders, properties);

        var search = new SearchRequest
        {
            From = page * pageSize,
            Size = pageSize,
            Sort = fieldsSort,
            Query = setFiltering(query, searchParams?.filters ?? [], searchParams?.orFilters ?? [], properties),
            Aggregations = setAggregations(searchParams?.aggregations ?? [], properties),
        };

        var response = await client.SearchAsync<TQueryModel>(x =>
        {
            x.Index(indexName);
            x.From(search.From);
            x.Size(search.Size);
            x.Sort(search.Sort);
            x.Query(search.Query);
            x.Aggregations(search.Aggregations);
            x.TrackTotalHits(new Elastic.Clients.Elasticsearch.Core.Search.TrackHits(true));
        });
        if (response.ElasticsearchServerError != null)
            throw new Exception(response.ElasticsearchServerError.Error.ToString());

        var totalPages = (int)Math.Ceiling((double)response.Total / pageSize ?? 1);

        return new PaginatedSearchResponse<TQueryModel>()
        {
            Hits = response.Documents,
            Metadata = new SearchPaginationMetadata
            {
                CurrentPage = page ?? 0,
                PageSize = response.Documents.Count,
                TotalCount = response.Total,
                TotalPages = totalPages,
                NextPage = page < totalPages && totalPages > 1,
                PreviousPage = page > 1,
            },
            IsError = response.ElasticsearchServerError != null,
            ErrorDetails = response?.ElasticsearchServerError?.Error?.ToString(),
            aggregations = response.Aggregations?.Select(x => new AggregationResponse
            {
                Field = x.Key,
                Aggregations = response.Aggregations?.GetStringTerms(x.Key).Buckets.ToDictionary(x => x.Key.ToString(), x => x.DocCount)
            }).ToList()
        };
    }

    public async Task<PaginatedSearchResponse<TQueryModel>> SearchNew<TQueryModel>(int? page, int? pageSize, string query, SearchParamsNew searchParams, string indexName) where TQueryModel : class
    {
        if (query == "null")
            query = null;

        var currentPage = page ?? 0;
        var currentPageSize = pageSize ?? 10;

        var client = getElasticClient(indexName);

        var properties = GetIndexProperties(client, indexName);

        SortOptions[] fieldsSort = setSorting(searchParams?.sortOrders, properties);

        Query queryFilter = setFilteringNew(query, searchParams?.filter ?? [], properties, searchParams?.logicType ?? "and");

         
        var response = await client.SearchAsync<TQueryModel>(x => x
            .Index(indexName)
            .From(currentPage * currentPageSize)
            .Size(currentPageSize)
            .Sort(fieldsSort)
            .Query(queryFilter)
            .Aggregations(setAggregationsNew(
                searchParams?.aggregations ?? [],
                searchParams?.filter ?? [],
                properties,
                query))
            .TrackTotalHits(new Elastic.Clients.Elasticsearch.Core.Search.TrackHits(true))
        );

        if (!response.IsValidResponse)
        {
            var err = response.ElasticsearchServerError?.Error;
            var root = err?.RootCause?.FirstOrDefault();

            throw new Exception(
                $"ES error: {err?.Type} - {err?.Reason}. Root: {root?.Type} - {root?.Reason}"
            );
        }

        var firstHit = response.Hits?.FirstOrDefault();
        if (firstHit != null)
        {
            // Debug aid for inspecting the raw ES document shape.
            var rawSource = System.Text.Json.JsonSerializer.Serialize(firstHit.Source);
            Console.WriteLine("RAW JSON: " + rawSource);
        }

        var totalPages = (int)Math.Ceiling((double)response.Total / currentPageSize);

        var deserializedObjects = response.Documents?.ToList() ?? new List<TQueryModel>();

        return new PaginatedSearchResponse<TQueryModel>()
        {
            Hits = deserializedObjects,
            Metadata = new SearchPaginationMetadata
            {
                CurrentPage = page ?? 0,
                PageSize = response.Documents.Count,
                TotalCount = response.Total,
                TotalPages = totalPages,
                NextPage = currentPage + 1 < totalPages,
                PreviousPage = currentPage > 0,
            },
            IsError = response.ElasticsearchServerError != null,
            ErrorDetails = response?.ElasticsearchServerError?.Error?.ToString(),
            globalAggregations = response.Aggregations?.Where(x => response.Aggregations?.GetGlobal(x.Key) != null).Select(x => new AggregationResponse
            {
                Field = x.Key,
                Aggregations = response.Aggregations?.GetGlobal(x.Key).GetFilters(x.Key).Buckets.FirstOrDefault()?.GetStringTerms(x.Key)?.Buckets.ToDictionary(x => x.Key.ToString(), x => x.DocCount) ?? response.Aggregations?.GetGlobal(x.Key).GetFilters(x.Key).Buckets.FirstOrDefault()?.GetDateHistogram(x.Key)?.Buckets.ToDictionary(x => x.Key.ToString(), x => x.DocCount)
            }).ToList()
        };
    }

    private static Properties GetIndexProperties(ElasticsearchClient client, string indexName)
    {
        var mappingsResponse = client.Indices.GetMapping();
        var indices = mappingsResponse?.Indices;
        if (indices == null)
        {
            throw new InvalidOperationException(
                $"Elasticsearch mappings for index '{indexName}' could not be loaded.");
        }

        var mappingEntry = indices.FirstOrDefault(index =>
            string.Equals(index.Key.ToString(), indexName, StringComparison.OrdinalIgnoreCase));

        var properties = mappingEntry.Value?.Mappings?.Properties;
        if (properties == null)
        {
            throw new InvalidOperationException(
                $"Elasticsearch index '{indexName}' was not found or does not have mappings yet. Create or reindex the dataset before searching.");
        }

        return properties;
    }

    private SortOptions[] setSorting(IEnumerable<SortType> sortOrders, Properties properties)
    {
        if (sortOrders == null)
            return Array.Empty<SortOptions>();
        SortOptions[] sortOptions = new SortOptions[sortOrders.Count()];
        for (int index = 0; index < sortOrders.Count(); index++)
            sortOptions[index] = SortOptions.Field(getCorrectFieldName(sortOrders.ElementAt(index).Key, properties), new FieldSort { Order = sortOrders.ElementAt(index).sortOrder });
        return sortOptions;
    }

    private Query setFiltering(string searchQuery, IEnumerable<DataFilter> filters, IEnumerable<DataFilter> orFilters, Properties properties)
    {
        var mustConditions = new List<Query>();
        var mustNotConditions = new List<Query>();
        var shouldConditions = new List<Query>();

        var safeSearchQuery = BuildQueryStringQueryValue(searchQuery, wrapWithWildcards: false);
        if (!string.IsNullOrWhiteSpace(safeSearchQuery))
        {
            mustConditions.Add(Query.QueryString(new QueryStringQuery() { Query = safeSearchQuery }));
        }

        foreach (var filter in filters)
        {
            string propertyType = getPropertyType(filter.PropertyName, properties);
            var fieldName = getFilterFieldName(filter.PropertyName, properties, filter.Operator);
            switch (filter.Operator)
            {
                case Models.Enums.DataFilterOperator.Eq:
                    mustConditions.Add(Query.Term(new TermQuery(fieldName)
                    {
                        Value = BuildTermFilterValue(filter.Value?.ToString(), propertyType),
                        CaseInsensitive = SupportsCaseInsensitiveStringMatching(propertyType) && !filter.CaseSensitive
                    }));
                    break;
                case Models.Enums.DataFilterOperator.Neq:
                    mustNotConditions.Add(Query.Term(new TermQuery(fieldName)
                    {
                        Value = BuildTermFilterValue(filter.Value?.ToString(), propertyType),
                        CaseInsensitive = SupportsCaseInsensitiveStringMatching(propertyType) && !filter.CaseSensitive
                    }));
                    break;
                case Models.Enums.DataFilterOperator.Like:
                    mustConditions.Add(Query.Wildcard(new WildcardQuery(fieldName) { Value = $"*{filter.Value}*", CaseInsensitive = !filter.CaseSensitive }));
                    break;
                case Models.Enums.DataFilterOperator.Nlike:
                    mustNotConditions.Add(Query.Wildcard(new WildcardQuery(fieldName) { Value = $"*{filter.Value}*", CaseInsensitive = !filter.CaseSensitive }));
                    break;
                case Models.Enums.DataFilterOperator.Lt:
                    if (propertyType == "date" || propertyType == "date_nanos")
                        mustConditions.Add(Query.Range(new DateRangeQuery(fieldName) { Format = "strict_date_time", Lt = filter.Value.ToString() }));
                    else
                        mustConditions.Add(Query.Range(new NumberRangeQuery(fieldName) { Lt = double.Parse(filter.Value.ToString()) }));
                    break;
                case Models.Enums.DataFilterOperator.Gt:
                    if (propertyType == "date" || propertyType == "date_nanos")
                        mustConditions.Add(Query.Range(new DateRangeQuery(fieldName) { Format = "strict_date_time", Gt = filter.Value.ToString() }));
                    else
                        mustConditions.Add(Query.Range(new NumberRangeQuery(fieldName) { Gt = double.Parse(filter.Value.ToString()) }));
                    break;
                case Models.Enums.DataFilterOperator.Le:
                    if (propertyType == "date" || propertyType == "date_nanos")
                        mustConditions.Add(Query.Range(new DateRangeQuery(fieldName) { Format = "strict_date_time", Lte = filter.Value.ToString() }));
                    else
                        mustConditions.Add(Query.Range(new NumberRangeQuery(fieldName) { Lte = double.Parse(filter.Value.ToString()) }));
                    break;
                case Models.Enums.DataFilterOperator.Ge:
                    if (propertyType == "date" || propertyType == "date_nanos")
                        mustConditions.Add(Query.Range(new DateRangeQuery(fieldName) { Format = "strict_date_time", Gte = filter.Value.ToString() }));
                    else
                        mustConditions.Add(Query.Range(new NumberRangeQuery(fieldName) { Gte = double.Parse(filter.Value.ToString()) }));
                    break;
                case Models.Enums.DataFilterOperator.Ex:
                    mustConditions.Add(Query.Exists(new ExistsQuery() { Field = fieldName }));
                    break;
                case Models.Enums.DataFilterOperator.Nex:
                    mustNotConditions.Add(Query.Exists(new ExistsQuery() { Field = fieldName }));
                    break;
                case Models.Enums.DataFilterOperator.In:
                    var values = JsonConvert.DeserializeObject<FieldValue[]>(filter.Value.ToString());
                    mustConditions.Add(Query.Terms(new TermsQuery() { Field = fieldName, Terms = new TermsQueryField(values) }));
                    break;
                default:
                    throw new ArgumentException($"Unexpected operator ${filter.Operator}");
            }
        }

        foreach (var orFilter in orFilters)
        {
            string propertyType = getPropertyType(orFilter.PropertyName, properties);
            var fieldName = getFilterFieldName(orFilter.PropertyName, properties, orFilter.Operator);
            switch (orFilter.Operator)
            {
                case Models.Enums.DataFilterOperator.Eq:
                    shouldConditions.Add(Query.Term(new TermQuery(fieldName)
                    {
                        Value = BuildTermFilterValue(orFilter.Value?.ToString(), propertyType),
                        CaseInsensitive = SupportsCaseInsensitiveStringMatching(propertyType) && !orFilter.CaseSensitive
                    }));
                    break;
                case Models.Enums.DataFilterOperator.Neq:
                    shouldConditions.Add(Query.Term(new TermQuery(fieldName)
                    {
                        Value = BuildTermFilterValue(orFilter.Value?.ToString(), propertyType),
                        CaseInsensitive = SupportsCaseInsensitiveStringMatching(propertyType) && !orFilter.CaseSensitive
                    }));
                    break;
                case Models.Enums.DataFilterOperator.Like:
                    shouldConditions.Add(Query.Wildcard(new WildcardQuery(fieldName) { Value = $"*{orFilter.Value}*", CaseInsensitive = !orFilter.CaseSensitive }));
                    break;
                case Models.Enums.DataFilterOperator.Nlike:
                    shouldConditions.Add(Query.Wildcard(new WildcardQuery(fieldName) { Value = $"*{orFilter.Value}*", CaseInsensitive = !orFilter.CaseSensitive }));
                    break;
                case Models.Enums.DataFilterOperator.Lt:
                    if (propertyType == "date" || propertyType == "date_nanos")
                        shouldConditions.Add(Query.Range(new DateRangeQuery(fieldName) { Format = "strict_date_time", Lt = orFilter.Value.ToString() }));
                    else
                        shouldConditions.Add(Query.Range(new NumberRangeQuery(fieldName) { Lt = double.Parse(orFilter.Value.ToString()) }));
                    break;
                case Models.Enums.DataFilterOperator.Gt:
                    if (propertyType == "date" || propertyType == "date_nanos")
                        shouldConditions.Add(Query.Range(new DateRangeQuery(fieldName) { Format = "strict_date_time", Gt = orFilter.Value.ToString() }));
                    else
                        shouldConditions.Add(Query.Range(new NumberRangeQuery(fieldName) { Gt = double.Parse(orFilter.Value.ToString()) }));
                    break;
                case Models.Enums.DataFilterOperator.Le:
                    if (propertyType == "date" || propertyType == "date_nanos")
                        shouldConditions.Add(Query.Range(new DateRangeQuery(fieldName) { Format = "strict_date_time", Lte = orFilter.Value.ToString() }));
                    else
                        shouldConditions.Add(Query.Range(new NumberRangeQuery(fieldName) { Lte = double.Parse(orFilter.Value.ToString()) }));
                    break;
                case Models.Enums.DataFilterOperator.Ge:
                    if (propertyType == "date" || propertyType == "date_nanos")
                        shouldConditions.Add(Query.Range(new DateRangeQuery(fieldName) { Format = "strict_date_time", Gte = orFilter.Value.ToString() }));
                    else
                        shouldConditions.Add(Query.Range(new NumberRangeQuery(fieldName) { Gte = double.Parse(orFilter.Value.ToString()) }));
                    break;
                case Models.Enums.DataFilterOperator.Ex:
                    shouldConditions.Add(Query.Exists(new ExistsQuery() { Field = fieldName }));
                    break;
                case Models.Enums.DataFilterOperator.Nex:
                    shouldConditions.Add(Query.Exists(new ExistsQuery() { Field = fieldName }));
                    break;
                case Models.Enums.DataFilterOperator.In:
                    var values = JsonConvert.DeserializeObject<FieldValue[]>(orFilter.Value.ToString());
                    shouldConditions.Add(Query.Terms(new TermsQuery() { Field = fieldName, Terms = new TermsQueryField(values) }));
                    break;
                default:
                    throw new ArgumentException($"Unexpected operator ${orFilter.Operator}");
            }
        }

        var query = Query.Bool(new BoolQuery
        {
            Must = mustConditions.Count != 0 ? mustConditions : null,
            MustNot = mustNotConditions.Count != 0 ? mustNotConditions : null,
            Should = shouldConditions.Count != 0 ? shouldConditions : null
        });
        return query;
    }

    private AggregationDictionary setAggregations(IEnumerable<AggregationType> aggregations, Properties properties)
    {
        var aggregationDictionary = new AggregationDictionary();
        foreach (var aggregation in aggregations)
            aggregationDictionary.Add(new TermsAggregation(getCorrectFieldName(aggregation.Property, properties)) { Field = getCorrectFieldName(aggregation.Property, properties), Size = aggregation.Size });
        return aggregationDictionary;
    }

    private string getCorrectFieldName(string fieldName, Properties properties, bool useExactTextField = true)
    {
        if (string.IsNullOrWhiteSpace(fieldName) || fieldName == "_id")
        {
            return fieldName;
        }
        if (fieldName.Contains(".keyword") || fieldName.Contains(".raw"))
        {
            return fieldName;
        }

        var resolvedFieldName = resolveFieldName(fieldName, properties);
        var propertyType = getPropertyType(resolvedFieldName, properties);

        return useExactTextField && propertyType == "text"
            ? $"{resolvedFieldName}.keyword"
            : resolvedFieldName;
    }

    private string getFilterFieldName(string fieldName, Properties properties, DataFilterOperator filterOperator)
    {
        var useExactTextField = filterOperator is DataFilterOperator.Eq
            or DataFilterOperator.Neq
            or DataFilterOperator.In;

        return getCorrectFieldName(fieldName, properties, useExactTextField);
    }

    private string getPropertyType(string fieldName, Properties properties)
    {
        if (string.IsNullOrWhiteSpace(fieldName) || fieldName == "_id")
        {
            return fieldName;
        }
        if (fieldName.Contains(".keyword"))
        {
            return fieldName;
        }

        var resolvedFieldName = resolveFieldName(fieldName, properties);
        var fieldSegments = resolvedFieldName.Split('.', StringSplitOptions.RemoveEmptyEntries);
        var currentProperties = properties;

        for (var index = 0; index < fieldSegments.Length; index++)
        {
            var resolvedSegment = resolveSegmentName(fieldSegments[index], currentProperties);
            if (resolvedSegment == null)
            {
                return string.Empty;
            }

            var property = currentProperties
                .FirstOrDefault(x => string.Equals(x.Key.ToString(), resolvedSegment, StringComparison.Ordinal))
                .Value;

            if (property == null)
            {
                return string.Empty;
            }

            if (index == fieldSegments.Length - 1)
            {
                return property.Type ?? string.Empty;
            }

            if (property is not ObjectProperty objectProperty || objectProperty.Properties == null)
            {
                return string.Empty;
            }

            currentProperties = objectProperty.Properties;
        }

        return string.Empty;
    }

    private string resolveFieldName(string fieldName, Properties properties)
    {
        var aliasedFieldName = applyFieldAlias(fieldName);
        var fieldSegments = aliasedFieldName.Split('.', StringSplitOptions.RemoveEmptyEntries);

        if (fieldSegments.Length == 0)
        {
            return aliasedFieldName;
        }

        var currentProperties = properties;
        var resolvedSegments = new List<string>();

        for (var index = 0; index < fieldSegments.Length; index++)
        {
            var resolvedSegment = resolveSegmentName(fieldSegments[index], currentProperties);
            if (resolvedSegment == null)
            {
                return aliasedFieldName;
            }

            resolvedSegments.Add(resolvedSegment);

            if (index == fieldSegments.Length - 1)
            {
                break;
            }

            var property = currentProperties
                .FirstOrDefault(x => string.Equals(x.Key.ToString(), resolvedSegment, StringComparison.Ordinal))
                .Value;

            if (property is not ObjectProperty objectProperty || objectProperty.Properties == null)
            {
                return aliasedFieldName;
            }

            currentProperties = objectProperty.Properties;
        }

        return string.Join(".", resolvedSegments);
    }

    private string? resolveSegmentName(string fieldSegment, Properties properties)
    {
        var aliasedSegment = applyFieldAlias(fieldSegment);

        var exactMatch = properties
            .FirstOrDefault(x => string.Equals(x.Key.ToString(), aliasedSegment, StringComparison.Ordinal));
        if (exactMatch.Value != null)
        {
            return exactMatch.Key.ToString();
        }

        var caseInsensitiveMatch = properties
            .FirstOrDefault(x => string.Equals(x.Key.ToString(), aliasedSegment, StringComparison.OrdinalIgnoreCase));
        if (caseInsensitiveMatch.Value != null)
        {
            return caseInsensitiveMatch.Key.ToString();
        }

        var normalizedSegment = normalizeFieldName(aliasedSegment);
        var normalizedMatch = properties
            .FirstOrDefault(x => normalizeFieldName(x.Key.ToString()) == normalizedSegment);

        return normalizedMatch.Value != null
            ? normalizedMatch.Key.ToString()
            : null;
    }

    private static string applyFieldAlias(string fieldName)
        => FieldAliases.TryGetValue(fieldName, out var aliasedFieldName)
            ? aliasedFieldName
            : fieldName;

    private static string normalizeFieldName(string fieldName)
        => new(fieldName
            .Where(char.IsLetterOrDigit)
            .Select(char.ToLowerInvariant)
            .ToArray());

    private static string EscapeQueryStringValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var escapedValue = new StringBuilder(value.Length * 2);
        for (var index = 0; index < value.Length; index++)
        {
            var current = value[index];

            if (current == '\\')
            {
                escapedValue.Append(@"\\");
                continue;
            }

            if ("+-=&|><!(){}[]^\"~*?:/".Contains(current))
            {
                escapedValue.Append('\\');
            }

            escapedValue.Append(current);
        }

        return escapedValue.ToString();
    }

    private static string BuildQueryStringQueryValue(string? value, bool wrapWithWildcards)
    {
        var escapedValue = EscapeQueryStringValue(value);
        if (string.IsNullOrWhiteSpace(escapedValue))
        {
            return string.Empty;
        }

        return wrapWithWildcards
            ? $"*{escapedValue}*"
            : escapedValue;
    }

    private static bool IsDatePropertyType(string? propertyType)
        => propertyType is "date" or "date_nanos";

    private static bool IsNumericPropertyType(string? propertyType)
        => propertyType is "byte"
            or "short"
            or "integer"
            or "long"
            or "unsigned_long"
            or "half_float"
            or "float"
            or "double"
            or "scaled_float";

    private static double ParseNumericFilterValue(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            throw new ArgumentException("Numeric filter value cannot be empty.");
        }

        if (double.TryParse(rawValue, NumberStyles.Float | NumberStyles.AllowThousands, CultureInfo.InvariantCulture, out var invariantValue))
        {
            return invariantValue;
        }

        if (double.TryParse(rawValue, NumberStyles.Float | NumberStyles.AllowThousands, CultureInfo.CurrentCulture, out var currentCultureValue))
        {
            return currentCultureValue;
        }

        var normalizedValue = rawValue.Replace(',', '.');
        if (double.TryParse(normalizedValue, NumberStyles.Float | NumberStyles.AllowThousands, CultureInfo.InvariantCulture, out var normalizedParsedValue))
        {
            return normalizedParsedValue;
        }

        throw new ArgumentException($"Could not parse numeric filter value '{rawValue}'.");
    }

    private static FieldValue BuildTermFilterValue(string? rawValue, string? propertyType)
    {
        if (IsNumericPropertyType(propertyType))
        {
            return ParseNumericFilterValue(rawValue);
        }

        return rawValue ?? string.Empty;
    }

    private static bool SupportsCaseInsensitiveStringMatching(string? propertyType)
        => propertyType is "text"
            or "keyword"
            or "constant_keyword"
            or "wildcard";

    private Query setFilteringNew(string searchQuery, IEnumerable<DataFilter> filters, Properties properties, string logicType = "and")
    {
        var mustConditions = new List<Query>();
        var mustNotConditions = new List<Query>();

        var safeSearchQuery = BuildQueryStringQueryValue(searchQuery, wrapWithWildcards: true);
        if (!string.IsNullOrWhiteSpace(safeSearchQuery))
            mustConditions.Add(Query.QueryString(new QueryStringQuery { Query = safeSearchQuery }));

        var globalSearchFilter = filters.FirstOrDefault(f => f.PropertyName == "globalSearch");
        if (globalSearchFilter != null)
        {
            var safeGlobalSearchValue = BuildQueryStringQueryValue(globalSearchFilter.Value?.ToString(), wrapWithWildcards: true);
            if (!string.IsNullOrWhiteSpace(safeGlobalSearchValue))
            {
            mustConditions.Add(Query.QueryString(new QueryStringQuery
            {
                Query = safeGlobalSearchValue
            }));
            }
        }

        //foreach (var filter in filters)
        var topLevelFilterQueries = new List<Query>();

        foreach (var filter in filters.Where(f => f.PropertyName != "globalSearch"))
        {
            if (filter.PropertyName == "_id")
            {
                topLevelFilterQueries.Add(getQuery(filter, properties));
                continue;
            }

            if (filter.or != null && filter.or.Any())
            {
                bool isExistsFilter = filter.or.All(o => o.Operator == DataFilterOperator.Ex && (o.PropertyName == "renderings" || o.PropertyName == "fields.EventId"));

                if (isExistsFilter)
                {
                    foreach (var option in filter.or)
                    {
                        mustNotConditions.Add(new ExistsQuery { Field = option.PropertyName });
                    }

                    mustNotConditions.Add(Query.Bool(new BoolQuery
                    {
                        Should = filter.or.Select(o =>
                            (Query)new ExistsQuery { Field = o.PropertyName }
                        ).ToList(),
                        MinimumShouldMatch = 1
                    }));

                    continue;
                }
                var shouldGroups = new List<Query>();
                foreach (var option in filter.or)
                {
                    var groupMust = new List<Query>();

                    if (!string.Equals(option.PropertyName, "noop", StringComparison.OrdinalIgnoreCase))
                        groupMust.Add(getQuery(option, properties));

                    if (option.and != null && option.and.Any())
                    {
                        foreach (var andFilter in option.and)
                            groupMust.Add(getQuery(andFilter, properties));
                    }

                    shouldGroups.Add(Query.Bool(new BoolQuery { Must = groupMust }));
                }

                topLevelFilterQueries.Add(Query.Bool(new BoolQuery
                {
                    Should = shouldGroups,
                    MinimumShouldMatch = 1
                }));

                continue;
            }

            topLevelFilterQueries.Add(getQuery(filter, properties));
        }

        if (topLevelFilterQueries.Count > 0)
        {
            if (string.Equals(logicType, "or", StringComparison.OrdinalIgnoreCase))
            {
                mustConditions.Add(Query.Bool(new BoolQuery
                {
                    Should = topLevelFilterQueries,
                    MinimumShouldMatch = 1
                }));
            }
            else
            {
                mustConditions.AddRange(topLevelFilterQueries);
            }
        }

        return Query.Bool(new BoolQuery
        {
            Must = mustConditions.Count != 0 ? mustConditions : null,
            MustNot = mustNotConditions?.Count > 0 ? mustNotConditions : null
        });

    }

    private Query getQuery(DataFilter filter, Properties properties)
    {
        var fieldName = getFilterFieldName(filter.PropertyName, properties, filter.Operator);

        if (filter.PropertyName == "_id")
            return Query.Ids(new IdsQuery { Values = new[] { filter.Value?.ToString() } });

        var propertyType = getPropertyType(filter.PropertyName, properties);

        switch (filter.Operator)
        {
            case Models.Enums.DataFilterOperator.Eq:
                return Query.Term(new TermQuery(fieldName)
                {
                    Value = BuildTermFilterValue(filter.Value?.ToString(), propertyType),
                    CaseInsensitive = SupportsCaseInsensitiveStringMatching(propertyType) && !filter.CaseSensitive
                });

            case Models.Enums.DataFilterOperator.Neq:
                return Query.Bool(new BoolQuery
                {
                    MustNot = new[]
                    {
                    Query.Term(new TermQuery(fieldName)
                    {
                        Value = BuildTermFilterValue(filter.Value?.ToString(), propertyType),
                        CaseInsensitive = SupportsCaseInsensitiveStringMatching(propertyType) && !filter.CaseSensitive
                    })
                }
                });

            case Models.Enums.DataFilterOperator.Like:
                {
                    var v = filter.Value?.ToString() ?? "";
                    var wildcard = (v.Contains("*") || v.Contains("?")) ? v : $"*{v}*";
                    return Query.Wildcard(new WildcardQuery(fieldName)
                    {
                        Value = wildcard,
                        CaseInsensitive = !filter.CaseSensitive
                    });
                }

            case Models.Enums.DataFilterOperator.Nlike:
                {
                    var v = filter.Value?.ToString() ?? "";
                    var wildcard = (v.Contains("*") || v.Contains("?")) ? v : $"*{v}*";
                    return Query.Bool(new BoolQuery
                    {
                        MustNot = new[]
                        {
                    Query.Wildcard(new WildcardQuery(fieldName)
                    {
                        Value = wildcard,
                        CaseInsensitive = !filter.CaseSensitive
                    })
                }
                    });
                }

            case Models.Enums.DataFilterOperator.Lt:
                return IsDatePropertyType(propertyType)
                    ? Query.Range(new DateRangeQuery(fieldName) { Format = "strict_date_time", Lt = filter.Value?.ToString() })
                    : Query.Range(new NumberRangeQuery(fieldName) { Lt = ParseNumericFilterValue(filter.Value?.ToString()) });

            case Models.Enums.DataFilterOperator.Gt:
                return IsDatePropertyType(propertyType)
                    ? Query.Range(new DateRangeQuery(fieldName) { Format = "strict_date_time", Gt = filter.Value?.ToString() })
                    : Query.Range(new NumberRangeQuery(fieldName) { Gt = ParseNumericFilterValue(filter.Value?.ToString()) });

            case Models.Enums.DataFilterOperator.Le:
                return IsDatePropertyType(propertyType)
                    ? Query.Range(new DateRangeQuery(fieldName) { Format = "strict_date_time", Lte = filter.Value?.ToString() })
                    : Query.Range(new NumberRangeQuery(fieldName) { Lte = ParseNumericFilterValue(filter.Value?.ToString()) });

            case Models.Enums.DataFilterOperator.Ge:
                return IsDatePropertyType(propertyType)
                    ? Query.Range(new DateRangeQuery(fieldName) { Format = "strict_date_time", Gte = filter.Value?.ToString() })
                    : Query.Range(new NumberRangeQuery(fieldName) { Gte = ParseNumericFilterValue(filter.Value?.ToString()) });

            case Models.Enums.DataFilterOperator.Ex:
                return Query.Exists(new ExistsQuery { Field = fieldName });

            case Models.Enums.DataFilterOperator.Nex:
                return Query.Bool(new BoolQuery
                {
                    MustNot = new[] { Query.Exists(new ExistsQuery { Field = fieldName }) }
                });

            case Models.Enums.DataFilterOperator.In:
                {
                    var values = JsonConvert.DeserializeObject<FieldValue[]>(filter.Value!.ToString());
                    return Query.Terms(new TermsQuery { Field = fieldName, Terms = new TermsQueryField(values) });
                }

            default:
                throw new ArgumentException($"Unexpected operator {filter.Operator}");
        }
    }
    private AggregationDictionary setAggregationsNew(IEnumerable<AggregationType> aggregations, IEnumerable<DataFilter> filters, Properties properties, string query)
    {
        var aggregationDictionary = new AggregationDictionary();
        foreach (var aggregation in aggregations)
        {

            var aggFilters = setFilteringNew(query, filters.Where(x => x.PropertyName != aggregation.Property), properties);

            var aggregationDictionaryNew = new AggregationDictionary();
            if (aggregation.AggregationTypes == "date_histogram")
            {
                aggregationDictionaryNew = new DateHistogramAggregation(getCorrectFieldName(aggregation.Property, properties)) { Field = getCorrectFieldName(aggregation.Property, properties), CalendarInterval = aggregation.Interval.Value };
            }
            else
            {
                aggregationDictionaryNew = new TermsAggregation(getCorrectFieldName(aggregation.Property, properties)) { Field = getCorrectFieldName(aggregation.Property, properties), Size = aggregation.Size };
            }
            var glolbalFilter = new FiltersAggregation(getCorrectFieldName(aggregation.Property, properties))
            {
                Filters = new Buckets<Query>([aggFilters]),
                Aggregations = aggregationDictionaryNew
            };

            aggregationDictionary.Add(new GlobalAggregation($"{getCorrectFieldName(aggregation.Property, properties)}")
            {
                Aggregations = glolbalFilter,
            });
        }

        return aggregationDictionary;
    }

    public async Task CreateIndex(string indexName)
    {
        var existsResponse = await ElasticsearchClient.Indices.ExistsAsync(indexName);
        if (existsResponse.Exists)
        {
            return;
        }

        var createResponse = await ElasticsearchClient.Indices.CreateAsync(indexName, x => x
            .Settings(s => s.MaxResultWindow(1000000)));
        if (!createResponse.IsValidResponse)
        {
            var error = createResponse.ElasticsearchServerError?.Error;
            var reason = error?.Reason ?? createResponse.DebugInformation;
            throw new InvalidOperationException($"Failed to create index '{indexName}'. Reason: {reason}");
        }
    }

    public async Task IndexData<T>(IEnumerable<T> data, string indexName) where T : class
    {
        var documents = data?.ToArray();
        if (documents is null || documents.Length == 0)
        {
            return;
        }

        await CreateIndex(indexName);
        var bulkResponse = await ElasticsearchClient.BulkAsync(b => b.Index(indexName).IndexMany(documents));
        if (!bulkResponse.IsValidResponse || bulkResponse.Errors)
        {
            throw new InvalidOperationException($"Failed to index data to '{indexName}'.");
        }
    }

    public async Task<HashSet<string>> GetExistingIdsAsync<TDocument>(string indexName, IEnumerable<string> ids) where TDocument : class
    {
        var normalizedIds = ids?
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.Ordinal)
            .Select(id => (FieldValue)id)
            .ToArray() ?? [];

        if (normalizedIds.Length == 0)
        {
            return [];
        }

        var client = getElasticClient(indexName);
        var existsResponse = await client.Indices.ExistsAsync(indexName);
        if (!existsResponse.Exists)
        {
            return [];
        }

        var response = await client.SearchAsync<TDocument>(x => x
            .Index(indexName)
            .Size(normalizedIds.Length)
            .Query(Query.Terms(new TermsQuery
            {
                Field = "id",
                Terms = new TermsQueryField(normalizedIds)
            }))
        );

        if (!response.IsValidResponse)
        {
            var err = response.ElasticsearchServerError?.Error;
            throw new InvalidOperationException(
                $"Failed to fetch existing Elasticsearch document ids from '{indexName}'. Reason: {err?.Reason ?? response.DebugInformation}");
        }

        var idProperty = typeof(TDocument).GetProperty("Id", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
        if (idProperty == null)
        {
            throw new InvalidOperationException($"Type '{typeof(TDocument).Name}' does not contain an Id property.");
        }

        return response.Documents
            .Select(document => idProperty.GetValue(document)?.ToString())
            .OfType<string>()
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .ToHashSet(StringComparer.Ordinal);
    }
}
