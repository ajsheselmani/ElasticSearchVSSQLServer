using AutoMapper;
using ElasticSearchVSSQLServer.Persistence.Audit;
using ElasticSearchVSSQLServer.Persistence.Auth;
using ElasticSearchVSSQLServer.Persistence.Controller;
using ElasticSearchVSSQLServer.Persistence.Domain;
using ElasticSearchVSSQLServer.Persistence.Identity;
using ElasticSearchVSSQLServer.Persistence.Sql.Context;
using ElasticSearchVSSQLServer.Persistence.SQLData;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Persistence.Sql.AutoMapper
{
    internal class PersistenceSqlMappingConfiguration : Profile
    {
        public PersistenceSqlMappingConfiguration() => SetupMappings();

        private void SetupMappings()
        {
            SetupDomainMapping();
            SetupControllerMapping();
            SetupLogMapping();
            SetupApplicationUser();
            SetupElectronicsDatasetMapping();
        }

        private void SetupDomainMapping()
        {
            CreateMap<Context.Domain, DomainDTO>().ReverseMap();
        }

        private void SetupControllerMapping()
        {
            CreateMap<Context.Controller, ControllerDTO>().ReverseMap();
        }

        private void SetupLogMapping()
        {
            CreateMap<Log, LogDTO>().ReverseMap();
        }

        private void SetupApplicationUser()
        {
            CreateMap<ApplicationUser, AuthenticationUserDTO>()
                .ForMember(dest => dest.Username, opt => opt.MapFrom(src => src.UserName));
        }

        private void SetupElectronicsDatasetMapping()
        {
            CreateMap<ElectronicEvents, ElectronicEventsDTO>().ReverseMap();
        }
    }
}
