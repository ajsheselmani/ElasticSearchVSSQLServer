using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Persistence.Realtime
{
    public record RealtimeEventDTO(
        string EventType,
        string EntityType,
        string? EntityId,
        string? Message,
        DateTime OccurredAt
    );
}
