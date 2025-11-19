namespace backend.DTOs;

public class GetUserCarsResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<UserCarDto>? Cars { get; set; }
}
