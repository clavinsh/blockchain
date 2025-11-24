namespace backend.Services.Fabric;

public class FabricClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<FabricClient> _logger;

    public FabricClient(HttpClient client, ILogger<FabricClient> logger)
    {
        _httpClient = client;
        _logger = logger;
    }

    public async Task<FabricResponse> RegisterVehicleAsync(string onChainId, string vin, string ownerUserId)
    {
        var request = new
        {
            onChainId,
            vin,
            ownerUserId
        };

        var response = await _httpClient.PostAsJsonAsync("/api/vehicles/register", request);

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<FabricResponse>()
            ?? throw new InvalidDataException("Failed to deserialize Fabric response");
    }

    public async Task<VehicleResponse> ReadVehicleAsync(string onChainId)
    {
        var response = await _httpClient.GetAsync($"/api/vehicles/{onChainId}");

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<VehicleResponse>()
            ?? throw new Exception("Vehicle not found");
    }

    public async Task<FabricResponse> SubmitDataHashAsync(string onChainId, string dataHash)
    {
        var request = new { onChainId, dataHash };

        var response = await _httpClient.PostAsJsonAsync("/api/telemetry/hash", request);

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<FabricResponse>()
            ?? throw new Exception("Failed to submit hash");
    }


    public async Task<FabricResponse> GrantAccessAsync(string onChainId, string insuranceCompanyId, int durationDays)
    {
        var request = new { onChainId, insuranceCompanyId, durationDays };

        var response = await _httpClient.PostAsJsonAsync("/api/access/grant", request);

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<FabricResponse>()
            ?? throw new Exception("Failed to grant access");
    }

    public async Task<AccessResponse> ReadAccessAsync(string onChainId, string insuranceCompanyId)
    {
        var response = await _httpClient.GetAsync($"/api/access/{onChainId}/{insuranceCompanyId}");

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<AccessResponse>()
            ?? throw new Exception("Failed to read access");
    }
}

