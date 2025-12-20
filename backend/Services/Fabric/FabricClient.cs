namespace backend.Services.Fabric;

/// <summary>
/// HTTP-based Fabric client that communicates with the Go gateway API
/// </summary>
public class FabricClient : IFabricClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<FabricClient> _logger;

    public FabricClient(HttpClient client, ILogger<FabricClient> logger)
    {
        _httpClient = client;
        _logger = logger;
    }

    public async Task<FabricResponse> SubmitTelemetryAsync(string vehicleId, string telemetryData)
    {
        var request = new
        {
            vehicleId,
            telemetryData
        };

        var response = await _httpClient.PostAsJsonAsync("/api/telemetry/submit", request);

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<FabricResponse>()
            ?? throw new InvalidDataException("Failed to deserialize Fabric response");
    }

    public async Task<List<VehicleTelemetry>> GetTelemetryByVehicleAsync(string vehicleId)
    {
        var response = await _httpClient.GetAsync($"/api/telemetry/vehicle/{vehicleId}");

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<List<VehicleTelemetry>>()
            ?? throw new Exception("Failed to retrieve telemetry");
    }

    public async Task<List<VehicleTelemetry>> GetAllTelemetryAsync()
    {
        var response = await _httpClient.GetAsync("/api/telemetry/all");

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<List<VehicleTelemetry>>()
            ?? throw new Exception("Failed to retrieve all telemetry");
    }

    public async Task<List<VehicleTelemetry>> GetTelemetryAfterAsync(DateTime timestamp)
    {
        var isoTimestamp = timestamp.ToString("yyyy-MM-ddTHH:mm:ssZ");
        var response = await _httpClient.GetAsync($"/api/telemetry/after?timestamp={isoTimestamp}");

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<List<VehicleTelemetry>>()
            ?? throw new Exception("Failed to retrieve telemetry");
    }

    public async Task<List<VehicleTelemetry>> GetTelemetryByVehicleAndTimeRangeAsync(
        string vehicleId, DateTime? startTime, DateTime? endTime)
    {
        var queryParams = new List<string> { $"vehicleId={vehicleId}" };

        if (startTime.HasValue)
        {
            queryParams.Add($"startTime={startTime.Value:yyyy-MM-ddTHH:mm:ssZ}");
        }

        if (endTime.HasValue)
        {
            queryParams.Add($"endTime={endTime.Value:yyyy-MM-ddTHH:mm:ssZ}");
        }

        var queryString = string.Join("&", queryParams);
        var response = await _httpClient.GetAsync($"/api/telemetry/range?{queryString}");

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<List<VehicleTelemetry>>()
            ?? throw new Exception("Failed to retrieve telemetry");
    }
}

