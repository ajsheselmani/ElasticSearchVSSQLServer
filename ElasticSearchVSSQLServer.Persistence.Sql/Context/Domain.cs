using System;
using System.Collections.Generic;

namespace ElasticSearchVSSQLServer.Persistence.Sql.Context;

public partial class Domain
{
    public int DomainId { get; set; }

    public string Name { get; set; }

    public bool? Active { get; set; }

    public virtual ICollection<AspNetUsers> AspNetUsers { get; set; } = new List<AspNetUsers>();
}
