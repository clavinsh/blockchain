namespace backend.Services.Fabric;

public class BlockchainVehicle
{
    public string OnChainId { get; set; } = string.Empty;
    public string VIN { get; set; } = string.Empty;
    public string OwnerUserId { get; set; } = string.Empty;
    public DateTime RegisteredAt { get; set; }
}
