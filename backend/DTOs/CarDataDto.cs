namespace backend.DTOs;

public class CarDataDto
{
    public int Id { get; set; }
    public int CarId { get; set; }
    public string CarData { get; set; } = string.Empty;
    public DateTime? InsertTime { get; set; }
}

public class GetCarDataResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<CarDataDto>? Data { get; set; }
}
