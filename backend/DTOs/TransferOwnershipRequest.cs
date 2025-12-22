namespace backend.DTOs;

public class TransferOwnershipRequest
{
    public int CarId { get; set; }
    public string NewOwnerEmail { get; set; } = string.Empty;
}