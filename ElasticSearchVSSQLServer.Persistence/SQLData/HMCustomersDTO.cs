using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Persistence.SQLData;
public class HMCustomersDTO
{
    public string Id { get; set; }

    public string Fn { get; set; }

    public string Active { get; set; }

    public string ClubMemberStatus { get; set; }

    public string FashionNewsFrequency { get; set; }

    public string Age { get; set; }

    public string PostalCode { get; set; }
}
