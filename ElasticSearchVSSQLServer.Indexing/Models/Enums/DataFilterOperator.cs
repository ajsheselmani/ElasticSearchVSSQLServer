using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace ElasticSearchVSSQLServer.Indexing.Models.Enums;
public enum DataFilterOperator
{
    [EnumMember(Value = "eq")]
    Eq,
    [EnumMember(Value = "Neq")]
    Neq,
    [EnumMember(Value = "Like")]
    Like,
    [EnumMember(Value = "Nlike")]
    Nlike,
    [EnumMember(Value = "Lt")]
    Lt,
    [EnumMember(Value = "Gt")]
    Gt,
    [EnumMember(Value = "Le")]
    Le,
    [EnumMember(Value = "Ge")]
    Ge,
    [EnumMember(Value = "Ex")]
    Ex,
    [EnumMember(Value = "Nex")]
    Nex,
    [EnumMember(Value = "In")]
    In

}

