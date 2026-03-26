using ElasticSearchVSSQLServer.Indexing.Configuration;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Services
{
    public abstract class ElasticClient(IOptions<ElasticConfiguration> options)
    {
    }
}
