using ElasticSearchVSSQLServer.Indexing.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Services;

public interface IIndexService
{
    Task CreateIndex(string name);
    Task IndexData<T>(T[] data, string index)
      where T : class;

    Task<PaginatedSearchResponse<TQueryModel>> Search<TQueryModel>(
    int? page,
    int? pageSize,
    string query,
    SearchParams searchParams,
    string indexName
)
    where TQueryModel : class;

    Task<PaginatedSearchResponse<TQueryModel>> SearchNew<TQueryModel>(
        int? page,
        int? pageSize,
        string query,
        SearchParamsNew searchParams,
        string indexName
        )
            where TQueryModel : class;

    Task IndexData<T>(IEnumerable<T> data, string indexName) where T : class;
}