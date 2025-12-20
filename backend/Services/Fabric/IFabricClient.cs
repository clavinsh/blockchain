namespace backend.Services.Fabric;

/// <summary>
/// Interface for Fabric blockchain client operations
/// </summary>
public interface IFabricClient
{
    /// <summary>
    /// Submits telemetry data to the blockchain
    /// </summary>
    Task<FabricResponse> SubmitTelemetryAsync(string carId, string carData);

    /// <summary>
    /// Gets all telemetry records for a specific vehicle
    /// </summary>
    Task<List<VehicleTelemetry>> GetTelemetryByVehicleAsync(string carId);

    /// <summary>
    /// Gets all telemetry records from the blockchain
    /// </summary>
    Task<List<VehicleTelemetry>> GetAllTelemetryAsync();

    /// <summary>
    /// Gets telemetry records inserted after a specific timestamp
    /// </summary>
    Task<List<VehicleTelemetry>> GetTelemetryAfterAsync(DateTime timestamp);

    /// <summary>
    /// Gets telemetry records for a vehicle within a time range
    /// </summary>
    Task<List<VehicleTelemetry>> GetTelemetryByVehicleAndTimeRangeAsync(
        string carId, DateTime? startTime, DateTime? endTime);
}
