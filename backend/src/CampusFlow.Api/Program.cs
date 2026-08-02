using CampusFlow.Api.Extensions;
using CampusFlow.Api.Middleware;
using CampusFlow.Application;
using CampusFlow.Infrastructure;
using CampusFlow.Infrastructure.Seed;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .WriteTo.File("logs/campusflow-.log", rollingInterval: RollingInterval.Day)
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, loggerConfig) => loggerConfig
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .WriteTo.Console()
        .WriteTo.File("logs/campusflow-.log", rollingInterval: RollingInterval.Day));

    builder.Services
        .AddApplication()
        .AddInfrastructure(builder.Configuration)
        .AddApiServices(builder.Configuration);

    var app = builder.Build();

    using (var scope = app.Services.CreateScope())
    {
        var seeder = scope.ServiceProvider.GetRequiredService<DbSeeder>();
        await seeder.EnsureIndexesAsync();
        await seeder.SeedAsync();
    }

    // Swagger is enabled in all environments (including Production) so evaluators can
    // explore the API without needing to switch ASPNETCORE_ENVIRONMENT.
    app.UseSwagger();
    app.UseSwaggerUI(options => options.SwaggerEndpoint("/swagger/v1/swagger.json", "CampusFlow API v1"));

    app.UseMiddleware<ExceptionHandlingMiddleware>();

    app.UseSerilogRequestLogging();

    app.UseHttpsRedirection();

    app.UseCors("Frontend");

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    app.MapGet("/", () => Results.Ok(new { service = "CampusFlow API", status = "running" }))
        .ExcludeFromDescription();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "CampusFlow API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

/// <summary>Entry point class, exposed so the WebApplicationFactory in integration tests can target it.</summary>
public partial class Program
{
}
