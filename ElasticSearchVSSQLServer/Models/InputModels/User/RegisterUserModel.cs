using ElasticSearchVSSQLServer.Resources;
using ElasticSearchVSSQLServer.RestApi.Utils;

namespace ElasticSearchVSSQLServer.RestApi.Models.InputModels.User
{
    public class RegisterUserModel : UserInputModel
    {
        public int? DomainId { get; set; }
        [FileExtension(".jpeg,.jpg,.bmp,.gif,.png,.svg", ErrorMessageResourceName = "AllowedFileFormatsDocuments", ErrorMessageResourceType = typeof(Resource))]
        public IFormFile? ImageProfile { get; set; }
    }
}
