using AutoMapper;
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
            CreateMap<LogDTO, LogsIndexDTO>()
                .ForMember(dest => dest.IP, opt => opt.MapFrom(src => src.Ip))
                .ForMember(dest => dest.FromContent, opt => opt.MapFrom(src => src.FormContent));
            CreateMap<LogsIndexDTO, LogDTO>()
                .ForMember(dest => dest.Ip, opt => opt.MapFrom(src => src.IP))
                .ForMember(dest => dest.FormContent, opt => opt.MapFrom(src => src.FromContent));
        }

        private void SetupElectronicsMapping()
        {
            CreateMap<ElectronicEventsDTO, ElectronicsDatasetIndexDTO>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.EventTime, opt => opt.MapFrom(src => src.EventTime))
            .ForMember(dest => dest.EventType, opt => opt.MapFrom(src => src.EventType))
            .ForMember(dest => dest.ProductId, opt => opt.MapFrom(src => src.ProductId))
            .ForMember(dest => dest.CategoryId, opt => opt.MapFrom(src => src.CategoryId))
            .ForMember(dest => dest.CategoryCode, opt => opt.MapFrom(src => src.CategoryCode))
            .ForMember(dest => dest.Brand, opt => opt.MapFrom(src => src.Brand))
            .ForMember(dest => dest.Price, opt => opt.MapFrom(src => src.Price))
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
            .ForMember(dest => dest.UserSession, opt => opt.MapFrom(src => src.UserSession))
            .ReverseMap();
        }

        private void SetupHMFashionMapping()
        {
            CreateMap<HMFashionDatasetDTO, H_MFashionFlatIndexDTO>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src =>
                    $"{src.Date:yyyy-MM-dd}_{src.CustomerId}_{src.ArticleId}_{src.SalesChannelId ?? 0}_{src.Price ?? 0}"))
                .ForMember(dest => dest.TransactionDate, opt => opt.MapFrom(src =>
                    src.Date.ToDateTime(TimeOnly.MinValue)))
                .ForMember(dest => dest.Price, opt => opt.MapFrom(src => Convert.ToDecimal(src.Price ?? 0d)))
                .ForMember(dest => dest.SalesChannelId, opt => opt.MapFrom(src => (int)(src.SalesChannelId ?? 0)))
                .ForMember(dest => dest.Age, opt => opt.MapFrom(src => ParseNullableInt(src.Age)))
                .ForMember(dest => dest.ArticleId, opt => opt.MapFrom(src => (long)src.ArticleId));
        }

        private static int? ParseNullableInt(string? value)
        {
            return int.TryParse(value, out var parsedValue)
                ? parsedValue
                : null;
        }
    }
}
