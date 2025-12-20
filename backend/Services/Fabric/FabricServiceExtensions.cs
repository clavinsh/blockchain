namespace backend.Services.Fabric;

/// <summary>
/// Extension methods for configuring Fabric services
/// </summary>
public static class FabricServiceExtensions
{
    public static IServiceCollection AddFabricServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var fabricGatewayUrl = configuration["Fabric:GatewayUrl"] ?? "http://localhost:3001";

        services.AddHttpClient<FabricClient>(client =>
        {
            client.BaseAddress = new Uri(fabricGatewayUrl);
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        services.AddScoped<TelemetryService>();

        return services;
    }
}
