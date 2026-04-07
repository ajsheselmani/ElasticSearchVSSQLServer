using System;
using System.Collections.Generic;
using System.Text;
using ElasticSearchVSSQLServer.Persistence.Shared;

namespace ElasticSearchVSSQLServer.Indexing.Models.User
{
    public class UserIndexDTO
    {
        public string Id { get; set; }
        public string Firstname { get; set; }
        public string Lastname { get; set; }
        public string UserName { get; set; }
        public string PersonalNumber { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public string? ImageProfile { get; set; }
        public DateTime? Birthdate { get; set; }
        public GenderEnum? Gender { get; set; }
        public bool EmailConfirmed { get; set; }
        public bool TwoFactorEnabled { get; set; }
        public DateTimeOffset? LockoutEnd { get; set; }
        public bool LockoutEnabled { get; set; }
        public int AccessFailedCount { get; set; }
        public bool PhoneNumberConfirmed { get; set; }
        public LanguageEnum Language { get; set; }
        public DateTime? PasswordExpires { get; set; }
        public bool ChangePassword { get; set; }
        public int? DomainId { get; set; }
        public string? DomainName { get; set; }
        public DateTime? ActivationDate { get; set; }
        public DateTime? ExpirationDate { get; set; }
    }
}
