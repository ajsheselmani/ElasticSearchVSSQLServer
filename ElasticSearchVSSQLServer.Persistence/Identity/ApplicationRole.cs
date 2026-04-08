using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace ElasticSearchVSSQLServer.Persistence.Identity;

public class ApplicationRole : IdentityRole
{
    [Required, StringLength(128)]
    public string Name_SQ { get; set; }

    [Required, StringLength(128)]
    public string Name_EN { get; set; }

    [Required, StringLength(128)]
    public string Name_SR { get; set; }

    [StringLength(4000)]
    public string? Description_SQ { get; set; }

    [StringLength(4000)]
    public string? Description_EN { get; set; }

    [StringLength(4000)]
    public string? Description_SR { get; set; }

    public DateTime? InsertedDate { get; set; }
}
