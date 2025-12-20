namespace backend.Services.Fabric;

/// <summary>
/// Service for telemetry-related blockchain operations
/// </summary>
public class TelemetryService : ITelemetryService
{
    private readonly IFabricClient _fabricClient;
    private readonly ILogger<TelemetryService> _logger;

    public TelemetryService(IFabricClient fabricClient, ILogger<TelemetryService> logger)
    {
        _fabricClient = fabricClient;
        _logger = logger;
    }

    public async Task<FabricResponse> SubmitTelemetryAsync(SubmitTelemetryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.VehicleId))
        {
            throw new ArgumentException("VehicleId is required", nameof(request.VehicleId));
        }

        if (string.IsNullOrWhiteSpace(request.TelemetryData))
        {
            throw new ArgumentException("TelemetryData is required", nameof(request.TelemetryData));
        }

        try
        {
            _logger.LogInformation(
                "Submitting telemetry data for vehicle {VehicleId}",
                request.VehicleId);

            var result = await _fabricClient.SubmitTelemetryAsync(
                request.VehicleId,
                request.TelemetryData);

            _logger.LogInformation(
                "Successfully submitted telemetry data for vehicle {VehicleId}",
                request.VehicleId);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to submit telemetry data for vehicle {VehicleId}",
                request.VehicleId);
            throw;
        }
    }

    public async Task<List<VehicleTelemetry>> GetTelemetryByVehicleAsync(string vehicleId)
    {
        if (string.IsNullOrWhiteSpace(vehicleId))
        {
            throw new ArgumentException("VehicleId is required", nameof(vehicleId));
        }

        try
        {
            _logger.LogInformation("Retrieving telemetry for vehicle {VehicleId}", vehicleId);

            var response = await _fabricClient.GetTelemetryByVehicleAsync(vehicleId);

            _logger.LogInformation(
                "Successfully retrieved {Count} telemetry records for vehicle {VehicleId}",
                response.Count,
                vehicleId);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve telemetry for vehicle {VehicleId}", vehicleId);
            throw;
        }
    }
}
