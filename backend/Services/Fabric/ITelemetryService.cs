namespace backend.Services.Fabric;

/// <summary>
/// Service interface for telemetry-related blockchain operations
/// </summary>
public interface ITelemetryService
{
    /// <summary>
    /// Submits telemetry data to the blockchain
    /// </summary>
    Task<FabricResponse> SubmitTelemetryAsync(SubmitTelemetryRequest request);

    /// <summary>
    /// Gets all telemetry records for a specific vehicle
    /// </summary>
    Task<List<VehicleTelemetry>> GetTelemetryByVehicleAsync(string vehicleId);
}

public record SubmitTelemetryRequest(string VehicleId, string TelemetryData);
