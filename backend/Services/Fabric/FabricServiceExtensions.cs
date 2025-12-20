namespace backend.Services.Fabric;

/// <summary>
/// Extension methods for configuring Fabric services
/// </summary>
public static class FabricServiceExtensions
{
    /// <summary>
    /// Adds Fabric blockchain services to the dependency injection container
    /// </summary>
    public static IServiceCollection AddFabricServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Configure HttpClient for FabricClient
        var fabricGatewayUrl = configuration["Fabric:GatewayUrl"] ?? "http://localhost:3001";

        services.AddHttpClient<IFabricClient, FabricClient>(client =>
        {
            client.BaseAddress = new Uri(fabricGatewayUrl);
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        // Register service layer
        services.AddScoped<IVehicleService, VehicleService>();
        services.AddScoped<ITelemetryService, TelemetryService>();
        services.AddScoped<IAccessService, AccessService>();

        // Register query service with its own HttpClient
        services.AddHttpClient<IVehicleQueryService, VehicleQueryService>(client =>
        {
            client.BaseAddress = new Uri(fabricGatewayUrl);
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        return services;
    }
}
