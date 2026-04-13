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
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Services;

public class IndexService(IOptions<ElasticConfiguration> config, IMapper mapper, ILogService logService, ElasticsearchClient elasticsearchClient) : ElasticClient(config, elasticsearchClient), IIndexService
{
    public async Task IndexData<T>(T[] data, string index) where T : class
    {
        var client = getElasticClient(index);

        var existsResponse = await client.Indices.ExistsAsync(index);
        if (!existsResponse.Exists)
        {
            var createResponse = await client.Indices.CreateAsync(index, x => x.Settings(s => s.MaxResultWindow(1000000)));
            if (!createResponse.IsValidResponse)
            {
                throw new Exception($"Failed to create index '{index}'. Error: {createResponse.ElasticsearchServerError?.Error?.Reason}");
            }
        }
        if(data != null && data.Any())
        {
            var bulkResponse = await client.BulkAsync(b => b
                .Index(index)
                .IndexMany(data)
            );

            if (!bulkResponse.IsValidResponse || bulkResponse.Errors)
                throw new Exception("Bulk indexing failed.");

            await client.Indices.RefreshAsync(index);
        }
    }

    public async Task<PaginatedSearchResponse<TQueryModel>> Search<TQueryModel>(int? page,
           int? pageSize,
           string? query,
           SearchParams searchParams, string indexName) where TQueryModel : class
    {
        if (query == "null")
            query = null;
        var client = getElasticClient(indexName);

        var mappingsResponse = client.Indices.GetMapping();
        var properties = mappingsResponse.Indices.Where(x => x.Key == indexName).First().Value.Mappings.Properties;

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
        var client = getElasticClient(indexName);

        var mappingsResponse = client.Indices.GetMapping();
        var properties = mappingsResponse.Indices.Where(x => x.Key == indexName).First().Value.Mappings.Properties;

        SortOptions[] fieldsSort = setSorting(searchParams?.sortOrders, properties);

        Query queryFilter = setFilteringNew(query, searchParams?.filter ?? [], properties);

        var search = new SearchRequest
        {
            From = page * pageSize,
            Size = pageSize,
            Sort = fieldsSort,
            Query = queryFilter,
            Aggregations = setAggregationsNew(searchParams?.aggregations ?? [], searchParams?.filter ?? [], properties, query),
            TrackTotalHits = new Elastic.Clients.Elasticsearch.Core.Search.TrackHits(true)
        };

        var response = await client.SearchAsync<dynamic>(x =>
        {
            x.Index(indexName);
            x.From(search.From);
            x.Size(search.Size);
            x.Sort(search.Sort);
            x.Query(search.Query);
            x.Aggregations(search.Aggregations);
            x.TrackTotalHits(new Elastic.Clients.Elasticsearch.Core.Search.TrackHits(true));
        });

        if (!response.IsValidResponse)
        {
            var err = response.ElasticsearchServerError?.Error;
            var root = err?.RootCause?.FirstOrDefault();

            throw new Exception(
                $"ES error: {err?.Type} - {err?.Reason}. Root: {root?.Type} - {root?.Reason}"
            );
        }
        var totalPages = (int)Math.Ceiling((double)response.Total / pageSize ?? 1);

        var deserializedObjects = response.Hits.Select(hit =>
        {
            var doc = JsonConvert.DeserializeObject<TQueryModel>(hit.Source.ToString());
            doc.Id = hit.Id;
            return doc;
        }).Cast<TQueryModel>().ToList();
        return new PaginatedSearchResponse<TQueryModel>()
        {
            Hits = deserializedObjects,
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
            globalAggregations = response.Aggregations?.Where(x => response.Aggregations?.GetGlobal(x.Key) != null).Select(x => new AggregationResponse
            {
                Field = x.Key,
                Aggregations = response.Aggregations?.GetGlobal(x.Key).GetFilters(x.Key).Buckets.FirstOrDefault()?.GetStringTerms(x.Key)?.Buckets.ToDictionary(x => x.Key.ToString(), x => x.DocCount) ?? response.Aggregations?.GetGlobal(x.Key).GetFilters(x.Key).Buckets.FirstOrDefault()?.GetDateHistogram(x.Key)?.Buckets.ToDictionary(x => x.Key.ToString(), x => x.DocCount)
            }).ToList()
        };
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

        if (!string.IsNullOrEmpty(searchQuery))
        {
            mustConditions.Add(Query.QueryString(new QueryStringQuery() { Query = searchQuery }));
        }

        foreach (var filter in filters)
        {
            string propertyType = getPropertyType(filter.PropertyName, properties);
            var fieldName = getCorrectFieldName(filter.PropertyName, properties);
            switch (filter.Operator)
            {
                case Models.Enums.DataFilterOperator.Eq:
                    mustConditions.Add(Query.Term(new TermQuery(fieldName) { Value = filter.Value.ToString(), CaseInsensitive = !filter.CaseSensitive }));
                    break;
                case Models.Enums.DataFilterOperator.Neq:
                    mustNotConditions.Add(Query.Term(new TermQuery(fieldName) { Value = filter.Value.ToString(), CaseInsensitive = !filter.CaseSensitive }));
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
            var fieldName = getCorrectFieldName(orFilter.PropertyName, properties);
            switch (orFilter.Operator)
            {
                case Models.Enums.DataFilterOperator.Eq:
                    shouldConditions.Add(Query.Term(new TermQuery(fieldName) { Value = orFilter.Value.ToString(), CaseInsensitive = !orFilter.CaseSensitive }));
                    break;
                case Models.Enums.DataFilterOperator.Neq:
                    shouldConditions.Add(Query.Term(new TermQuery(fieldName) { Value = orFilter.Value.ToString(), CaseInsensitive = !orFilter.CaseSensitive }));
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

    private string getCorrectFieldName(string fieldName, Properties properties)
    {
        if (fieldName == "_id")
        {
            return fieldName;
        }
        if (fieldName.Contains(".keyword"))
        {
            return fieldName;
        }
        if (fieldName.Contains("."))
        {
            return fieldName;
        }

        if (fieldName.Contains("."))
        {
            properties = ((ObjectProperty)properties.FirstOrDefault(x => x.Key == fieldName.Split(".")[0]).Value).Properties;
            if (properties.Any(x => x.Key == fieldName.Split(".")[1] && x.Value.Type == "text"))
                fieldName += ".raw";
            return fieldName;
        }
        if (properties.Any(x => x.Key == fieldName && x.Value.Type == "text"))
            fieldName += ".raw";
        return fieldName;
    }

    private string getPropertyType(string fieldName, Properties properties)
    {
        if (fieldName == "_id")
        {
            return fieldName;
        }
        if (fieldName.Contains(".keyword"))
        {
            return fieldName;
        }

        if (fieldName.Contains("."))
        {
            return fieldName;
        }
        if (fieldName.Contains("."))
        {
            properties = ((ObjectProperty)properties.FirstOrDefault(x => x.Key == fieldName.Split(".")[0]).Value).Properties;
            return properties.FirstOrDefault(x => x.Key == fieldName.Split(".")[1]).Value.Type;
        }
        return properties.FirstOrDefault(x => x.Key == fieldName).Value.Type;
    }

    private Query setFilteringNew(string searchQuery, IEnumerable<DataFilter> filters, Properties properties)
    {
        var mustConditions = new List<Query>();
        var mustNotConditions = new List<Query>();

        if (!string.IsNullOrEmpty(searchQuery))
            mustConditions.Add(Query.QueryString(new QueryStringQuery { Query = $"*{searchQuery}*" }));

        foreach (var filter in filters)
        {
            if (filter.PropertyName == "_id")
            {
                mustConditions.Add(getQuery(filter, properties));
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

                mustConditions.Add(Query.Bool(new BoolQuery
                {
                    Should = shouldGroups,
                    MinimumShouldMatch = 1
                }));

                continue;
            }

            mustConditions.Add(getQuery(filter, properties));
        }

        return Query.Bool(new BoolQuery
        {
            Must = mustConditions.Count != 0 ? mustConditions : null,
            MustNot = mustNotConditions?.Count > 0 ? mustNotConditions : null
        });

    }

    private Query getQuery(DataFilter filter, Properties properties)
    {
        var fieldName = getCorrectFieldName(filter.PropertyName, properties);

        if (filter.PropertyName == "_id")
            return Query.Ids(new IdsQuery { Values = new[] { filter.Value?.ToString() } });

        var propertyType = getPropertyType(filter.PropertyName, properties);

        switch (filter.Operator)
        {
            case Models.Enums.DataFilterOperator.Eq:
                return Query.Term(new TermQuery(fieldName)
                {
                    Value = filter.Value?.ToString(),
                    CaseInsensitive = !filter.CaseSensitive
                });

            case Models.Enums.DataFilterOperator.Neq:
                return Query.Bool(new BoolQuery
                {
                    MustNot = new[]
                    {
                    Query.Term(new TermQuery(fieldName)
                    {
                        Value = filter.Value?.ToString(),
                        CaseInsensitive = !filter.CaseSensitive
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
                return (propertyType is "date" or "date_nanos")
                    ? Query.Range(new DateRangeQuery(fieldName) { Format = "strict_date_time", Lt = filter.Value?.ToString() })
                    : Query.Range(new NumberRangeQuery(fieldName) { Lt = double.Parse(filter.Value!.ToString()) });

            case Models.Enums.DataFilterOperator.Gt:
                return (propertyType is "date" or "date_nanos")
                    ? Query.Range(new DateRangeQuery(fieldName) { Format = "strict_date_time", Gt = filter.Value?.ToString() })
                    : Query.Range(new NumberRangeQuery(fieldName) { Gt = double.Parse(filter.Value!.ToString()) });

            case Models.Enums.DataFilterOperator.Le:
                return (propertyType is "date" or "date_nanos")
                    ? Query.Range(new DateRangeQuery(fieldName) { Format = "strict_date_time", Lte = filter.Value?.ToString() })
                    : Query.Range(new NumberRangeQuery(fieldName) { Lte = double.Parse(filter.Value!.ToString()) });

            case Models.Enums.DataFilterOperator.Ge:
                return (propertyType is "date" or "date_nanos")
                    ? Query.Range(new DateRangeQuery(fieldName) { Format = "strict_date_time", Gte = filter.Value?.ToString() })
                    : Query.Range(new NumberRangeQuery(fieldName) { Gte = double.Parse(filter.Value!.ToString()) });

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

    public async Task ReIndex(int id)
    {
        await CreateIndex("elasticvssql_logs");

        var logs = await logService.GetAllLogsData();
        var mappedData = mapper.Map<LogsIndexDTO[]>(logs);
        
        await IndexData(mappedData, "claim_index");
    }

    public async Task CreateIndex(string indexName)
    {
        var existsResponse = await ElasticsearchClient.Indices.ExistsAsync(indexName);
        if (existsResponse.Exists)
        {
            return;
        }

        var createResponse = await ElasticsearchClient.Indices.CreateAsync(indexName);
        if (!createResponse.IsValidResponse)
        {
            throw new InvalidOperationException($"Failed to create index '{indexName}'.");
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
}