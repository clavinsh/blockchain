namespace backend.DTOs;

public class DrivingReport
{
    public string CarId { get; set; }
    public DateTime ReportGeneratedAt { get; set; }
    public DateRange AnalysisPeriod { get; set; }
    public BasicStatistics BasicStatistics { get; set; }
    public DrivingBehaviorAnalysis DrivingBehavior { get; set; }
    public double OverallDrivingScore { get; set; }
    public RiskAssessment RiskAssessment { get; set; }
    public VehicleWearEstimate VehicleWearEstimate { get; set; }
    public List<string> Recommendations { get; set; }
}

public class DateRange
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public TimeSpan Duration => EndDate - StartDate;
}

public class BasicStatistics
{
    public double TotalDistance { get; set; }
    public TimeSpan TotalDrivingTime { get; set; }
    public double AverageSpeed { get; set; }
    public double MaxSpeed { get; set; }
    public int AverageRpm { get; set; }
    public int MaxRpm { get; set; }
    public double FuelConsumption { get; set; }
    public int NumberOfTrips { get; set; }
    public int DataPointsAnalyzed { get; set; }
}

public class DrivingBehaviorAnalysis
{
    public List<DrivingEvent> HarshBrakingEvents { get; set; }
    public List<DrivingEvent> HarshAccelerationEvents { get; set; }
    public List<DrivingEvent> HarshCorneringEvents { get; set; }
    public List<DrivingEvent> SpeedingEvents { get; set; }
    public List<DrivingEvent> OverRevvingEvents { get; set; }
    public double SmoothDrivingPercentage { get; set; }
}

public class DrivingEvent
{
    public DateTime Timestamp { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public EventSeverity Severity { get; set; }
    public double Speed { get; set; }
    public string Description { get; set; }
}

public class RiskAssessment
{
    public RiskLevel OverallRiskLevel { get; set; }
    public double InsurancePremiumMultiplier { get; set; }
    public double AccidentRiskScore { get; set; }
    public double VehicleDepreciationRate { get; set; }
    public List<string> RiskFactors { get; set; }
    public List<string> PositiveFactors { get; set; }
}

public class VehicleWearEstimate
{
    public WearLevel BrakeWearLevel { get; set; }
    public WearLevel EngineWearLevel { get; set; }
    public WearLevel TireWearLevel { get; set; }
    public double TransmissionStress { get; set; }
    public decimal EstimatedMaintenanceCost { get; set; }
}

public class InsuranceSummary
{
    public string VehicleId { get; set; }
    public DateRange AnalysisPeriod { get; set; }
    public double DrivingScore { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public double RecommendedPremiumMultiplier { get; set; }
    public int SafetyIncidents { get; set; }
    public double TotalDistance { get; set; }
    public double SmoothDrivingPercentage { get; set; }
}

public class ResellerSummary
{
    public string VehicleId { get; set; }
    public DateRange AnalysisPeriod { get; set; }
    public double TotalDistance { get; set; }
    public double DrivingScore { get; set; }
    public string VehicleConditionRating { get; set; }
    public double EstimatedDepreciationRate { get; set; }
    public WearLevel BrakeCondition { get; set; }
    public WearLevel EngineCondition { get; set; }
    public WearLevel TireCondition { get; set; }
    public decimal EstimatedMaintenanceCost { get; set; }
    public List<string> RecommendedActions { get; set; }
}

public enum EventSeverity
{
    Low,
    Medium,
    High
}

public enum RiskLevel
{
    VeryLow,
    Low,
    Moderate,
    High,
    VeryHigh
}

public enum WearLevel
{
    Low,
    Moderate,
    High,
    Severe
}