using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Persistence.Shared
{
    public static class RealtimeTopics
    {
        public const string RealtimeEvents = "REALTIME_EVENTS";
    }

    public static class RealtimeEventTypes
    {
        public const string LoginSuccess = "LOGIN_SUCCESS";
        public const string UserCreated = "USER_CREATED";
    }

    public static class RealtimeEntityTypes
    {
        public const string Auth = "AUTH";
        public const string User = "USER";
    }
}
