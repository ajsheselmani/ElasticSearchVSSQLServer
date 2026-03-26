using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace ElasticSearchVSSQLServer.Persistence.General;
public class ApplicationRole : IdentityRole
{
    [Required, StringLength(128)]
    public string Name_SQ { get; set; }

    [Required, StringLength(128)]
    public string Name_EN { get; set; }

    [Required, StringLength(128)]
    public string Name_SR { get; set; }

    [StringLength(4000)]
    public string Description { get; set; }
}
