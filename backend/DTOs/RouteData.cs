namespace backend.DTOs;

/// <summary>
/// Represents a single GPS point on a route
/// </summary>
public class RoutePoint
{
    public DateTime Timestamp { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double Altitude { get; set; }
    public double SpeedKmh { get; set; }
}

/// <summary>
/// Represents the complete route data for a car trip
/// </summary>
public class RouteData
{
    public int CarId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int TotalPoints { get; set; }
    public List<RoutePoint> Points { get; set; } = new();
}
