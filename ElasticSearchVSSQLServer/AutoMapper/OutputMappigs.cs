using AutoMapper;
using ElasticSearchVSSQLServer.Indexing.Models.LogsIndexed;
using ElasticSearchVSSQLServer.Persistence.Audit;
using ElasticSearchVSSQLServer.Persistence.SQLData;
using ElasticSearchVSSQLServer.Persistence.User;
using ElasticSearchVSSQLServer.RestApi.Models.OutputModels.Logs;
using ElasticSearchVSSQLServer.RestApi.Models.OutputModels.SQLData;
using ElasticSearchVSSQLServer.RestApi.Models.OutputModels.User;
using System;

namespace ElasticSearchVSSQLServer.RestApi.AutoMapper
{
    public class OutputMappigs : Profile
    {
        public OutputMappigs() => SetupMappings();

        private void SetupMappings()
        {
            CreateMap<UserDto, UserOutputModel>();
            CreateMap<UserDto, CurrentUserOutputModel>();
            CreateMap<HMFashionDatasetDTO, HMDatasetOutputModel>();
            CreateMap<LogDTO, LogsOutputModel>();
            CreateMap<LogsIndexDTO, LogsOutputModel>()
                .ForMember(dest => dest.Ip, opt => opt.MapFrom(src => src.IP))
                .ForMember(dest => dest.FormContent, opt => opt.MapFrom(src => src.FromContent))
                .ForMember(
                    dest => dest.InsertedDate,
                    opt => opt.MapFrom(src =>
                        src.InsertedDate.HasValue && src.InsertedDate.Value != DateTime.MinValue
                            ? src.InsertedDate
                            : null));
            CreateMap<ElectronicEventsDTO, ElectronicEventsOutputModel>().ReverseMap();
        }
    }
}
