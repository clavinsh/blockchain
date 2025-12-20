namespace backend.DTOs;

public class CreateCarRequest
{
    public string Brand { get; set; } = null!;
    public string Model { get; set; } = null!;
    public int Year { get; set; }
    public string? LicensePlate { get; set; }
    public string? Vin { get; set; }
    public string? Color { get; set; }
    public int? Mileage { get; set; }
}
