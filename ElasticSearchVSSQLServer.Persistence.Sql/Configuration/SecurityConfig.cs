using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Persistence.Sql.Configuration
{
    public class SecurityConfig
    {
        public int MaxFailedAccessAttempts { get; set; }
        public bool RequireLowercase { get; set; }
        public bool RequireNonAlphanumeric { get; set; }
        public bool RequireUppercase { get; set; }
        public bool RequireDigit { get; set; }
        public int RequiredLength { get; set; }
        public bool RequireConfirmedEmail { get; set; }
        public bool RequireConfirmedAccount { get; set; }
    }
}
