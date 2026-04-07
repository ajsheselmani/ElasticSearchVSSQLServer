using System;
using System.Collections.Generic;

namespace ElasticSearchVSSQLServer.Persistence.Sql.Context;

public partial class AspNetUsers
{
    public string Id { get; set; }

    public string Firstname { get; set; }

    public string Lastname { get; set; }

    public string PersonalNumber { get; set; }

    public string Birthdate { get; set; }

    public double? Gender { get; set; }

    public string PasswordExpires { get; set; }

    public double? ChangePassword { get; set; }

    public double? Language { get; set; }

    public int? DomainId { get; set; }

    public string UserName { get; set; }

    public string NormalizedUserName { get; set; }

    public string Email { get; set; }

    public string NormalizedEmail { get; set; }

    public double? EmailConfirmed { get; set; }

    public string PasswordHash { get; set; }

    public string SecurityStamp { get; set; }

    public string ConcurrencyStamp { get; set; }

    public string PhoneNumber { get; set; }

    public double? PhoneNumberConfirmed { get; set; }

    public double? TwoFactorEnabled { get; set; }

    public string LockoutEnd { get; set; }

    public double? LockoutEnabled { get; set; }

    public double? AccessFailedCount { get; set; }

    public string ActivationDate { get; set; }

    public string ExpirationDate { get; set; }

    public string ImageProfile { get; set; }

    public virtual Domain Domain { get; set; }
}
