namespace backend.Services.Fabric;

public class FabricResponse
{
    public bool Success { get; set; }
    public string? Result { get; set; }
    public string? TxId { get; set; }
    public string? Error { get; set; }
}

