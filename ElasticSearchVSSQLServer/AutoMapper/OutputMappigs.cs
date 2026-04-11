using AutoMapper;
using ElasticSearchVSSQLServer.Persistence.Audit;
using ElasticSearchVSSQLServer.Persistence.SQLData;
using ElasticSearchVSSQLServer.Persistence.User;
using ElasticSearchVSSQLServer.RestApi.Models.OutputModels.Logs;
using ElasticSearchVSSQLServer.RestApi.Models.OutputModels.SQLData;
using ElasticSearchVSSQLServer.RestApi.Models.OutputModels.User;

namespace ElasticSearchVSSQLServer.RestApi.AutoMapper
{
    public class OutputMappigs : Profile
    {
        public OutputMappigs() => SetupMappings();

        private void SetupMappings()
        {
            CreateMap<UserDto, UserOutputModel>();
            CreateMap<UserDto, CurrentUserOutputModel>();
            CreateMap<BankDatasetDTO, BankDatasetOutputModel>();
            CreateMap<LogDTO, LogsOutputModel>();
            CreateMap<ElectronicEventsDTO, ElectronicEventsOutputModel>();
        }
    }
}
