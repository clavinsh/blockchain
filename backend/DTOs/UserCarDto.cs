namespace backend.DTOs;

public class UserCarDto
{
    public int CarId { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public string? Vin { get; set; }
    public string? Color { get; set; }
    public int Mileage { get; set; }
    public DateTime? AssignedAt { get; set; }
    public string RoleCode { get; set; } = string.Empty;
}
