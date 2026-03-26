using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Configuration;

public class ElasticConfiguration
{
    public string Uri { get; set; }
    public string Index { get; set; }
    public string Username { get; set; }
    public string Password { get; set; }
    public string CertificateFingerprint { get; set; }
    public string ApiKey { get; set; }
}