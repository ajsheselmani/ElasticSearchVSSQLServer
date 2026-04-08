using AutoMapper;
using ElasticSearchVSSQLServer.Persistence.Auth;
using ElasticSearchVSSQLServer.Persistence.User;
using ElasticSearchVSSQLServer.RestApi.Models.InputModels;
using ElasticSearchVSSQLServer.RestApi.Models.InputModels.User;

namespace ElasticSearchVSSQLServer.RestApi.AutoMapper
{
#pragma warning disable 1591
    public class InputMappings : Profile
    {
        public InputMappings() => SetupMappings();

        private void SetupMappings()
        {
            CreateMap<LoginInputModel, LoginDTO>();
            CreateMap<UserInputModel, UserDto>();

        }
    }
}
