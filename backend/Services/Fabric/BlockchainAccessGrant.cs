namespace backend.Services.Fabric;

public class BlockchainAccessGrant
{
    public string OnChainId { get; set; } = string.Empty;
    public string GrantedTo { get; set; } = string.Empty;
    public DateTime GrantedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
}
