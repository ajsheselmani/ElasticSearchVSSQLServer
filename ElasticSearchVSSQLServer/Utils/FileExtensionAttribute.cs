using ElasticSearchVSSQLServer.Resources;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using System.ComponentModel.DataAnnotations;
using System.Resources;

namespace ElasticSearchVSSQLServer.RestApi.Utils;

[AttributeUsage(AttributeTargets.Property, AllowMultiple = false, Inherited = false)]
public class FileExtensionAttribute : ValidationAttribute, IClientModelValidator
{
    private readonly string AllowedFormats;

    public FileExtensionAttribute(string AllowedFormats)
    {
        this.AllowedFormats = AllowedFormats;
    }

    public void AddValidation(ClientModelValidationContext context)
    {
        ResourceManager rm = new ResourceManager(typeof(Resource));
        var localizedError = rm.GetString(ErrorMessageResourceName);

        MergeAttribute(context.Attributes, "data-val", "true");
        MergeAttribute(context.Attributes, "accept", AllowedFormats);
        var errorMessage = FormatErrorMessage(context.ModelMetadata.GetDisplayName());
        MergeAttribute(context.Attributes, "data-val-fileextension", string.Format(localizedError, AllowedFormats));
        MergeAttribute(context.Attributes, "data-val-fileextension-formats", AllowedFormats);
    }

    bool MergeAttribute(IDictionary<string, string> attributes, string key, string value)
    {
        if (attributes.ContainsKey(key))
        {
            return false;
        }
        attributes.Add(key, value);
        return true;
    }

    protected override ValidationResult IsValid(object value, ValidationContext validationContext)
    {
        var file = value as IFormFile;
        string[] allowedFormats = AllowedFormats.Split(",");
        if (file != null)
        {
            string extension = System.IO.Path.GetExtension(file.FileName).ToLower();
            if (!allowedFormats.Contains(extension))
            {
                ResourceManager rm = new ResourceManager(typeof(Resource));
                string localizedError = rm.GetString(ErrorMessageResourceName);
                return new ValidationResult(string.Format(localizedError, AllowedFormats));
            }
        }
        return ValidationResult.Success;
    }
}
