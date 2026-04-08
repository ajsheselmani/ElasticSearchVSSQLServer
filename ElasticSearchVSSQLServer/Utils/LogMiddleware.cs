using ElasticSearchVSSQLServer.Domain.Services.Audit;
using ElasticSearchVSSQLServer.Persistence.Audit;
using ElasticSearchVSSQLServer.RestApi.Utils.General;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.Mvc.Controllers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace ElasticSearchVSSQLServer.RestApi.Utils.Middlewares;

#pragma warning disable 1591
public class LogMiddleware(IServiceProvider serviceProvider, RequestDelegate next, ILogger<LogMiddleware> logger)
{
	public async Task Invoke(HttpContext context)
	{
        var userName = UserClaimHelper.GetFullName(context.User);

        string[] methodsToAvoid = ["OPTIONS", "CONNECT"];

		if (methodsToAvoid.Any(x => x == context.Request.Method))
		{
			await next(context);
			return;
		}

		var userId = UserClaimHelper.GetUserId(context.User);
		using (Serilog.Context.LogContext.PushProperty("UserId", userId))
		{
			if (context.Request.Path.HasValue && StatisFileRequest(context.Request.Path.Value))
			{
				await next(context);
				return;
			}

			string path = context.Request.Path.ToString();
			string[] segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);

			string controller = segments.Length > 1 ? segments[1] : null;
			string action = segments.Length > 2 ? segments[2] : null;

			var log = new LogDTO
			{
				UserId = userId,
				IP = context.Connection.RemoteIpAddress?.ToString(),
				Url = context.Request.GetDisplayUrl(),
				HttpMethod = context.Request.Method,
				Controller = controller,
				Action = action,
				Error = false,
				InsertedDate = DateTime.Now
			};

			using var scope = serviceProvider.CreateScope();
			var logService = scope.ServiceProvider.GetService<ILogService>();
			context.Request.EnableBuffering();

			using var stramReader = new StreamReader(context.Request.Body, leaveOpen: true);
			string requestBody = await stramReader.ReadToEndAsync();
			try
			{
				var requestBodyObj = JsonConvert.DeserializeObject<JObject>(requestBody);
				if (requestBodyObj != null && requestBodyObj.Properties().Any(a => a.Name.Contains("password", StringComparison.OrdinalIgnoreCase)))
				{
					var propertiesToRemove = requestBodyObj.Properties()
						.Where(a => a.Name.Contains("password", StringComparison.OrdinalIgnoreCase))
						.ToList();

					foreach (var prop in propertiesToRemove)
					{
						requestBodyObj.Remove(prop.Name);
					}
				}

				string newRequestBody = requestBodyObj?.ToString();
				log.FromContent = newRequestBody;
				context.Request.Body.Position = 0;
			}
			catch (Exception ex)
			{
				log.FromContent = requestBody;
				context.Request.Body.Position = 0;
			}

			using var memoryStream = new MemoryStream();
			var originalResponseBody = context.Response.Body;
			context.Response.Body = memoryStream;

			try
			{
				await next(context);

				log.Response = null;

				var endpoint = context.GetEndpoint();
				var actionDescriptor = endpoint?.Metadata.GetMetadata<ControllerActionDescriptor>();

				if (actionDescriptor is null)
				{
					memoryStream.Seek(0, SeekOrigin.Begin);
					await memoryStream.CopyToAsync(originalResponseBody);
					context.Response.Body = originalResponseBody;
                    
					await logService.Save(log);
					return;
				}

				var logResponse = actionDescriptor.MethodInfo.IsDefined(typeof(LogBodyResponseAttribute), false);
				if (logResponse)
				{
					memoryStream.Seek(0, SeekOrigin.Begin);
					await memoryStream.CopyToAsync(originalResponseBody);
					context.Response.Body = originalResponseBody;

					memoryStream.Seek(0, SeekOrigin.Begin);
					string responseBody = await new StreamReader(memoryStream).ReadToEndAsync();
					log.Response = responseBody;
				}
				else
				{
					memoryStream.Seek(0, SeekOrigin.Begin);
					await memoryStream.CopyToAsync(originalResponseBody);
					context.Response.Body = originalResponseBody;
				}

				await logService.Save(log);
			}
			catch (Exception ex)
			{
				log.Error = true;
				log.Exception = JsonConvert.SerializeObject(ex);
				context.Response.StatusCode = 500;
				await context.Response.WriteAsync("An error occurred.");
				await logService.Save(log);
				logger.LogInformation("Ka ndodhur nje gabim: {ExMessage} nga perdoruesit {userName}", ex.Message, userName);
				throw;
			}
		}
	}

	public static bool StatisFileRequest(string path)
	{
		var staticFileExtensions = new[] { ".css", ".js", ".ico", ".png", ".jpg", ".svg", ".html", ".txt" };
		return staticFileExtensions.Any(a => path.EndsWith(a, StringComparison.OrdinalIgnoreCase));
	}
}