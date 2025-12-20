namespace backend.Services.Fabric;

/// <summary>
/// Represents telemetry data stored on the blockchain
/// </summary>
public class VehicleTelemetry
{
    public string VehicleId { get; set; } = string.Empty;
    public string TelemetryData { get; set; } = string.Empty;
    public DateTime InsertedAt { get; set; }
}
