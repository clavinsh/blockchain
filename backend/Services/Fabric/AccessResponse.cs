namespace backend.Services.Fabric;

public class AccessResponse
{
    public bool Success { get; set; }
    public BlockchainAccessGrant? Access { get; set; }
}
