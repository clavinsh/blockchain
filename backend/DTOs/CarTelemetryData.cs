namespace backend.DTOs;

public class VehicleSensorData
{
    // ==================== IDENTIFICATION ====================
    /// <summary>
    /// Unique identifier for this sensor reading
    /// </summary>
    public string SensorDataId { get; set; }
    /// <summary>
    /// Vehicle identifier (VIN or system-generated ID)
    /// </summary>
    public string VehicleId { get; set; }
    /// <summary>
    /// Timestamp when this data was recorded
    /// </summary>
    public DateTime Timestamp { get; set; }
    // ==================== GPS POSITION ====================
    /// <summary>
    /// Latitude coordinate (decimal degrees)
    /// Example: 56.9496 (Riga, Latvia)
    /// </summary>
    public double Latitude { get; set; }
    /// <summary>
    /// Longitude coordinate (decimal degrees)
    /// Example: 24.1052 (Riga, Latvia)
    /// </summary>
    public double Longitude { get; set; }
    /// <summary>
    /// Altitude in meters above sea level
    /// </summary>
    public double Altitude { get; set; }
    /// <summary>
    /// GPS accuracy in meters
    /// </summary>
    public double GpsAccuracy { get; set; }
    /// <summary>
    /// Heading/bearing in degrees (0-360, where 0 is North)
    /// </summary>
    public double Heading { get; set; }
    // ==================== ACCELEROMETER READINGS ====================
    /// <summary>
    /// Acceleration in X-axis (lateral) in g-force
    /// Positive = right turn, Negative = left turn
    /// </summary>
    public double AccelerationX { get; set; }
    /// <summary>
    /// Acceleration in Y-axis (longitudinal) in g-force
    /// Positive = acceleration, Negative = braking
    /// </summary>
    public double AccelerationY { get; set; }
    /// <summary>
    /// Acceleration in Z-axis (vertical) in g-force
    /// Detects bumps, road conditions
    /// </summary>
    public double AccelerationZ { get; set; }
    // ==================== SPEED MEASUREMENTS ====================
    /// <summary>
    /// Current vehicle speed in km/h
    /// </summary>
    public double SpeedKmh { get; set; }
    // ==================== VEHICLE ECU TELEMETRY ====================
    /// <summary>
    /// Engine revolutions per minute
    /// </summary>
    public int EngineRpm { get; set; }
    /// <summary>
    /// Engine temperature in Celsius
    /// </summary>
    public int EngineTemperature { get; set; }
    /// <summary>
    /// Fuel level as percentage (0-100)
    /// </summary>
    public double FuelLevel { get; set; }
    /// <summary>
    /// Odometer reading in kilometers
    /// </summary>
    public double OdometerKm { get; set; }
    /// <summary>
    /// Throttle position as percentage (0-100)
    /// </summary>
    public double ThrottlePosition { get; set; }
    /// <summary>
    /// Brake pedal pressed (true/false)
    /// </summary>
    public bool BrakePedal { get; set; }
}