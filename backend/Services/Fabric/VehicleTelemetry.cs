namespace backend.Services.Fabric;

/// <summary>
/// Represents telemetry data stored on the blockchain
/// </summary>
public class VehicleTelemetry
{
    public string CarId { get; set; } = string.Empty;
    public string CarData { get; set; } = string.Empty;
    public DateTime InsertTime { get; set; }
}
