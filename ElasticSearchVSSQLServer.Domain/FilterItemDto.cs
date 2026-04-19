using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Domain;
    public class FilterItemDto
    {
        public string PropertyName { get; set; }
        public string Operator { get; set; }
        public string? Value { get; set; }
        public bool Negate { get; set; }
        public bool CaseSensitive { get; set; }
    }

