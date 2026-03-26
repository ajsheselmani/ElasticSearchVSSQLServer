using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Domain.Configuration;
public class DomainConfiguration
{
    public string ClientApplicationPath { get; set; }
    public JWTConfiguration JWTConfiguration { get; set; }
}