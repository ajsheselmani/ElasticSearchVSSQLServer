using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Persistence.Sql.Configuration
{
    public class DatabaseConfiguration
    {
        public string ConnectionString { get; set; }

        public string ConnectionStringTesting { get; set; }

        public SecurityConfig SecurityConfig { get; set; }
    }
}
