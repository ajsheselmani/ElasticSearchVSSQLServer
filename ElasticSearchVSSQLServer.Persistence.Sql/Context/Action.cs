using System;
using System.Collections.Generic;

namespace ElasticSearchVSSQLServer.Persistence.Sql.Context;

public partial class Action
{
    public int ActionId { get; set; }

    public int? ControllerId { get; set; }

    public string Name { get; set; }

    public string Type { get; set; }

    public string Title { get; set; }

    public string Description { get; set; }

    public bool? Active { get; set; }

    public virtual Controller Controller { get; set; }
}
