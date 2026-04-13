using AutoMapper;
using ElasticSearchVSSQLServer.Indexing.Models.BankDataset;
using ElasticSearchVSSQLServer.Indexing.Models.Datasets;
using ElasticSearchVSSQLServer.Indexing.Models.LogsIndexed;
using ElasticSearchVSSQLServer.Indexing.Models.User;
using ElasticSearchVSSQLServer.Persistence.Audit;
using ElasticSearchVSSQLServer.Persistence.SQLData;
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
            SetupLogsMapping();
            SetupBankMapping();
            SetupElectronicsMapping();
            SetupHMFashionMapping();
        }

        private void SetupUserMapping()
        {
            CreateMap<UserDto, UserIndexDTO>()
           .ForMember(d => d.DomainName,
                opt => opt.MapFrom(s => s.domain != null ? s.domain.Name : null));
        }

        private void SetupLogsMapping()
        {
            CreateMap<LogDTO, LogsIndexDTO>();
        }

        private void SetupBankMapping()
        {
            CreateMap<BankDatasetDTO, BankDatasetIndexDTO>().ReverseMap();
        }

        private void SetupElectronicsMapping()
        {
            CreateMap<ElectronicEventsDTO, ElectronicsDatasetIndexDTO>().ReverseMap();
        }

        private void SetupHMFashionMapping()
        {
            CreateMap<HMFashionDatasetDTO, H_MFashionFlatIndexDTO>().ReverseMap();
        }
    }
}
