namespace backend.DTOs;

public class CreateCarResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? CarId { get; set; }
}
