using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Services;
public interface IElasticDataIndexService
{
    Task IndexAllBankDatas();
}
