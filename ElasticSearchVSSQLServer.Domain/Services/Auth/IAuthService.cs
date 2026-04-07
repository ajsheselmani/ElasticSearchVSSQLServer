using ElasticSearchVSSQLServer.Persistence.Auth;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Domain.Services.Auth
{
    public interface IAuthService
    {
        Task<LoginResultDto> Login(LoginDTO login);
    }
}
