using AutoMapper;
using ElasticSearchVSSQLServer.Indexing.Models.User;
using ElasticSearchVSSQLServer.Persistence.User;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ElasticSearchVSSQLServer.Indexing.AutoMapper
{
    public class IndexMappingConfiguration : Profile
    {
        public IndexMappingConfiguration()
        {
            SetupMapping();
        }

        private void SetupMapping()
        {
            SetupUserMapping();
        }

        private void SetupUserMapping()
        {
            CreateMap<UserDto, UserIndexDTO>()
           .ForMember(d => d.DomainName,
                opt => opt.MapFrom(s => s.domain != null ? s.domain.Name : null));
        }
    }
}
