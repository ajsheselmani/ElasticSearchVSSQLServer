using AutoMapper;
using ElasticSearchVSSQLServer.Persistence.Auth;
using ElasticSearchVSSQLServer.RestApi.Models.Auth;

namespace ElasticSearchVSSQLServer.RestApi.AutoMapper
{
#pragma warning disable 1591
    public class InputMappings : Profile
    {
        public InputMappings() => SetupMappings();

        private void SetupMappings()
        {
            CreateMap<LoginInputModel, LoginDTO>();
        }
    }
}
