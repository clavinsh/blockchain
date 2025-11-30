namespace backend.DTOs;

public class UpdateCarRequest
{
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public int? Year { get; set; }
    public string? LicensePlate { get; set; }
    public string? Vin { get; set; }
    public string? Color { get; set; }
    public int? Mileage { get; set; }
}
