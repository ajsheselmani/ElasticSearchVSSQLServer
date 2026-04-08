using AutoMapper;
using ElasticSearchVSSQLServer.Persistence.User;
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


        }
    }
}
