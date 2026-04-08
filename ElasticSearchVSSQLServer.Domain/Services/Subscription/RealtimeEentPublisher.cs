using HotChocolate.Subscriptions;
using ElasticSearchVSSQLServer.Persistence.Realtime;
using ElasticSearchVSSQLServer.Persistence.Shared;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Domain.Services.Subscription
{
    public class RealtimeEventPublisher
    {
        private readonly ITopicEventSender _topicEventSender;

        public RealtimeEventPublisher(ITopicEventSender topicEventSender)
        {
            _topicEventSender = topicEventSender;
        }

        public ValueTask PublishAsync(
            string eventType,
            string entityType,
            string? entityId = null,
            string? role = null,
            string? message = null)
        {
            return _topicEventSender.SendAsync(
                RealtimeTopics.RealtimeEvents,
                new RealtimeEventDTO(
                    EventType: eventType,
                    EntityType: entityType,
                    EntityId: entityId,
                    Message: message,
                    OccurredAt: DateTime.UtcNow
                )
            );
        }
    }
}
