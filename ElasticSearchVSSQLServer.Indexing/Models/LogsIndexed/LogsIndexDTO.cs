using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.Models.LogsIndexed;
    public class LogsIndexDTO
    {
        public string Id { get; set; }
        public string UserId { get; set; }

        public string IP { get; set; }
        public string Url { get; set; }
        public string HttpMethod { get; set; }
        public string Controller { get; set; }
        public string Action { get; set; }
        public bool Error { get; set; }
        public string FromContent { get; set; }
        public string Response { get; set; }
        public string Exception { get; set; }
        public DateTime? InsertedDate { get; set; }
    }
