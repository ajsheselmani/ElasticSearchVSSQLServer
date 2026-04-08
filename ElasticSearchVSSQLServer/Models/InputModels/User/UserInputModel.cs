using ElasticSearchVSSQLServer.Resources;
using ElasticSearchVSSQLServer.RestApi.Utils;
using System.ComponentModel.DataAnnotations;

namespace ElasticSearchVSSQLServer.RestApi.Models.InputModels.User
{
    public class UserInputModel
    {
        public string? Id { get; set; }

        [Required(ErrorMessageResourceName = "Required", ErrorMessageResourceType = typeof(Resource))]
        [MaxLength(64, ErrorMessageResourceName = "MaxLength", ErrorMessageResourceType = typeof(Resource))]
        public string PersonalNumber { get; set; }

        [Required(ErrorMessageResourceName = "Required", ErrorMessageResourceType = typeof(Resource))]
        public int Gender { get; set; }

        [Required(ErrorMessageResourceName = "Required", ErrorMessageResourceType = typeof(Resource))]
        public string Firstname { get; set; }

        [Required(ErrorMessageResourceName = "Required", ErrorMessageResourceType = typeof(Resource))]
        public string Lastname { get; set; }

        [Required(ErrorMessageResourceName = "Required", ErrorMessageResourceType = typeof(Resource))]
        public DateTime? Birthdate { get; set; }

        public string? UserName { get; set; } 

        [Required(ErrorMessageResourceName = "Required", ErrorMessageResourceType = typeof(Resource))]
        [MaxLength(64, ErrorMessageResourceName = "MaxLength", ErrorMessageResourceType = typeof(Resource))]
        public string PhoneNumber { get; set; }

        [MaxLength(256, ErrorMessageResourceName = "MaxLength", ErrorMessageResourceType = typeof(Resource))]
        [EmailAddress(ErrorMessageResourceName = "InvalidEmail", ErrorMessageResourceType = typeof(Resource))]
        [Required(ErrorMessageResourceName = "Required", ErrorMessageResourceType = typeof(Resource))]
        public string Email { get; set; }

        public string? Password { get; set; }

        [Compare("Password", ErrorMessageResourceName = "PasswordNotMatch", ErrorMessageResourceType = typeof(Resource))]
        public string? ConfirmPassword { get; set; }

        [Range(1, 3, ErrorMessageResourceName = "ValueOutRangeLanguageID", ErrorMessageResourceType = typeof(Resource))]
        public int Language { get; set; }

        public IFormFile? imageFile { get; set; }
        
    }
}
