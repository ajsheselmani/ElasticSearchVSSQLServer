using System;
using System.Collections.Generic;

namespace ElasticSearchVSSQLServer.Persistence.Sql.Context;

public partial class Controller
{
    public int ControllerId { get; set; }

    public string Name { get; set; }

    public bool Active { get; set; }

    public virtual ICollection<Action> Action { get; set; } = new List<Action>();
}
