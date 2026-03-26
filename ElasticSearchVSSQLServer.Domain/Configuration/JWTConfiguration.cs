using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Domain.Configuration;
public class JWTConfiguration
{
    public bool ValidateIssuerSigningKey { get; set; }
    public string IssuerSigningKey { get; set; }
    public bool ValidateIssuer { get; set; }
    public string ValidIssuer { get; set; }
    public bool ValidateAudience { get; set; }
    public string ValidAudience { get; set; }
    public bool RequireExpirationTime { get; set; }
    public bool ValidateLifetime { get; set; }
    public int TokenExpireHour { get; set; }
}