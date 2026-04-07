using AutoMapper;
using ElasticSearchVSSQLServer.Persistence.Auth;
using ElasticSearchVSSQLServer.Persistence.Identity;
using ElasticSearchVSSQLServer.Persistence.User;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Domain.AutoMapper
{
    internal class DomainMappingConfiguration : Profile
    {
        public DomainMappingConfiguration() => SetupMapping();

        private void SetupMapping()
        {
            SetupUserMapping();
        }

        private void SetupUserMapping()
        {
            CreateMap<ApplicationUser, AuthenticationUserDTO>();
            CreateMap<UserDto, ApplicationUser>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.EmailConfirmed, opt => opt.Ignore())
                .ForMember(dest => dest.PhoneNumberConfirmed, opt => opt.Ignore())
                .ForMember(dest => dest.TwoFactorEnabled, opt => opt.Ignore())
                .ForMember(dest => dest.LockoutEnabled, opt => opt.Ignore())
                .ForMember(dest => dest.LockoutEnd, opt => opt.Ignore())
                .ForMember(dest => dest.ChangePassword, opt => opt.Ignore())
                .ForMember(dest => dest.InsertedDate, opt => opt.Ignore())
                .ForMember(dest => dest.ExpirationDate, opt => opt.Ignore())
                .ForMember(dest => dest.ActivationDate, opt => opt.Ignore())
                .ForMember(dest => dest.InsertedFrom, opt => opt.Ignore())
                .ForMember(dest => dest.PasswordExpires, opt =>
                {
                    opt.PreCondition((src, dest) => src.Id == null);
                    opt.MapFrom(src => DateTime.Now.AddYears(1));
                }
                ).ReverseMap(); 

        }
    }
}
