namespace backend.Services;

using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

/// <summary>
/// Generates driving behavior reports for insurance and resale purposes
/// </summary>
public class TelemetryDataService
{
    private readonly BlockchainDbContext _context;

    // Thresholds for analysis
    private const double HARSH_BRAKING_THRESHOLD = -0.3;  // g-force
    private const double HARSH_ACCELERATION_THRESHOLD = 0.3;  // g-force
    private const double HARSH_CORNERING_THRESHOLD = 0.25;  // g-force
    private const double SPEEDING_THRESHOLD_URBAN = 50.0;  // km/h

    public TelemetryDataService(BlockchainDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Generate a comprehensive driving behavior report for a specific car and time period
    /// </summary>
    /// <param name="carId">The car identifier</param>
    /// <param name="from">Start date of the analysis period</param>
    /// <param name="to">End date of the analysis period</param>
    /// <param name="driverName">Optional driver name for the report</param>
    /// <returns>Complete driving behavior report</returns>
    public async Task<DrivingReport> GenerateReportAsync(int carId, DateTime from, DateTime to)
    {
        var telemetryData = await FetchTelemetryDataAsync(carId, from, to);

        if (telemetryData == null || !telemetryData.Any())
        {
            throw new ArgumentException("No telemetry data found for the specified period");
        }

        var report = new DrivingReport
        {
            CarId = carId.ToString(),
            ReportGeneratedAt = DateTime.UtcNow,
            AnalysisPeriod = new DateRange
            {
                StartDate = telemetryData.Min(x => x.Timestamp),
                EndDate = telemetryData.Max(x => x.Timestamp)
            }
        };

        // Calculate basic statistics
        report.BasicStatistics = CalculateBasicStatistics(telemetryData);

        // Analyze driving behavior
        report.DrivingBehavior = AnalyzeDrivingBehavior(telemetryData);

        // Calculate overall driving score
        report.OverallDrivingScore = CalculateDrivingScore(report.DrivingBehavior);

        // Generate risk assessment
        report.RiskAssessment = GenerateRiskAssessment(report.DrivingBehavior, report.OverallDrivingScore);

        // Calculate vehicle wear estimates
        report.VehicleWearEstimate = EstimateVehicleWear(telemetryData, report.DrivingBehavior);

        // Generate recommendations
        report.Recommendations = GenerateRecommendations(report);

        return report;
    }

    /// <summary>
    /// Generate a summary suitable for insurance companies
    /// </summary>
    /// <param name="carId">The car identifier</param>
    /// <param name="from">Start date of the analysis period</param>
    /// <param name="to">End date of the analysis period</param>
    /// <param name="driverName">Optional driver name for the report</param>
    /// <returns>Insurance summary report</returns>
    public async Task<InsuranceSummary> GenerateInsuranceSummaryAsync(int carId, DateTime from, DateTime to)
    {
        var report = await GenerateReportAsync(carId, from, to);

        return new InsuranceSummary
        {
            VehicleId = report.CarId,
            AnalysisPeriod = report.AnalysisPeriod,
            DrivingScore = report.OverallDrivingScore,
            RiskLevel = report.RiskAssessment.OverallRiskLevel,
            RecommendedPremiumMultiplier = report.RiskAssessment.InsurancePremiumMultiplier,
            SafetyIncidents = report.DrivingBehavior.HarshBrakingEvents.Count +
                            report.DrivingBehavior.HarshAccelerationEvents.Count +
                            report.DrivingBehavior.SpeedingEvents.Count,
            TotalDistance = report.BasicStatistics.TotalDistance,
            SmoothDrivingPercentage = report.DrivingBehavior.SmoothDrivingPercentage
        };
    }

    /// <summary>
    /// Generate a summary suitable for car resellers
    /// </summary>
    /// <param name="carId">The car identifier</param>
    /// <param name="from">Start date of the analysis period</param>
    /// <param name="to">End date of the analysis period</param>
    /// <returns>Reseller summary report</returns>
    public async Task<ResellerSummary> GenerateResellerSummaryAsync(int carId, DateTime from, DateTime to)
    {
        var report = await GenerateReportAsync(carId, from, to);

        return new ResellerSummary
        {
            VehicleId = report.CarId,
            AnalysisPeriod = report.AnalysisPeriod,
            TotalDistance = report.BasicStatistics.TotalDistance,
            DrivingScore = report.OverallDrivingScore,
            VehicleConditionRating = DetermineConditionRating(report.OverallDrivingScore),
            EstimatedDepreciationRate = report.RiskAssessment.VehicleDepreciationRate,
            BrakeCondition = report.VehicleWearEstimate.BrakeWearLevel,
            EngineCondition = report.VehicleWearEstimate.EngineWearLevel,
            TireCondition = report.VehicleWearEstimate.TireWearLevel,
            EstimatedMaintenanceCost = report.VehicleWearEstimate.EstimatedMaintenanceCost,
            RecommendedActions = report.Recommendations
        };
    }

    /// <summary>
    /// Get route data (GPS coordinates and speed) for displaying on a map
    /// </summary>
    /// <param name="carId">The car identifier</param>
    /// <param name="from">Start date of the period</param>
    /// <param name="to">End date of the period</param>
    /// <returns>Route data with GPS points and speed information</returns>
    public async Task<RouteData> GetRouteDataAsync(int carId, DateTime from, DateTime to)
    {
        var telemetryData = await FetchTelemetryDataAsync(carId, from, to);

        if (telemetryData == null || !telemetryData.Any())
        {
            throw new ArgumentException("No route data found for the specified period");
        }

        var routePoints = telemetryData
            .OrderBy(d => d.Timestamp)
            .Select(d => new RoutePoint
            {
                Timestamp = d.Timestamp,
                Latitude = d.Latitude,
                Longitude = d.Longitude,
                Altitude = d.Altitude,
                SpeedKmh = d.SpeedKmh
            })
            .ToList();

        return new RouteData
        {
            CarId = carId,
            StartTime = routePoints.First().Timestamp,
            EndTime = routePoints.Last().Timestamp,
            TotalPoints = routePoints.Count,
            Points = routePoints
        };
    }

    /// <summary>
    /// Fetches telemetry data from CarDataCache table for a specific car within the specified time period
    /// </summary>
    /// <param name="carId">The car identifier</param>
    /// <param name="from">Start date of the period</param>
    /// <param name="to">End date of the period</param>
    /// <returns>List of vehicle sensor data within the specified period</returns>
    private async Task<List<VehicleSensorData>> FetchTelemetryDataAsync(int carId, DateTime from, DateTime to)
    {
        // Fetch data from CarDataCache where InsertTime is between from and to
        var cacheEntries = await _context.CarDataCaches
            .Where(c => c.CarId == carId
                     && c.InsertTime >= from
                     && c.InsertTime <= to
                     && c.DeleteTime == null) // Only fetch non-deleted entries
            .OrderBy(c => c.InsertTime)
            .ToListAsync();

        var telemetryDataList = new List<VehicleSensorData>();

        // Deserialize the JSON data from each cache entry
        foreach (var entry in cacheEntries)
        {
            try
            {
                var sensorData = JsonSerializer.Deserialize<VehicleSensorData>(entry.CarData);
                if (sensorData != null)
                {
                    telemetryDataList.Add(sensorData);
                }
            }
            catch (JsonException ex)
            {
                // Log the error but continue processing other entries
                Console.WriteLine($"Failed to deserialize data for CarDataCache ID {entry.Id}: {ex.Message}");
            }
        }

        return telemetryDataList;
    }

    private BasicStatistics CalculateBasicStatistics(List<VehicleSensorData> data)
    {
        var orderedData = data.OrderBy(x => x.Timestamp).ToList();

        var totalDistance = orderedData.Last().OdometerKm - orderedData.First().OdometerKm;
        var totalTime = (orderedData.Last().Timestamp - orderedData.First().Timestamp).TotalHours;

        return new BasicStatistics
        {
            TotalDistance = totalDistance,
            TotalDrivingTime = TimeSpan.FromHours(totalTime),
            AverageSpeed = data.Average(x => x.SpeedKmh),
            MaxSpeed = data.Max(x => x.SpeedKmh),
            AverageRpm = (int)data.Average(x => x.EngineRpm),
            MaxRpm = data.Max(x => x.EngineRpm),
            FuelConsumption = orderedData.First().FuelLevel - orderedData.Last().FuelLevel,
            NumberOfTrips = 1, // Can be enhanced to detect trip segments
            DataPointsAnalyzed = data.Count
        };
    }

    private DrivingBehaviorAnalysis AnalyzeDrivingBehavior(List<VehicleSensorData> data)
    {
        var analysis = new DrivingBehaviorAnalysis();

        // Analyze braking events
        analysis.HarshBrakingEvents = data
            .Where(x => x.AccelerationY < HARSH_BRAKING_THRESHOLD)
            .Select(x => new DrivingEvent
            {
                Timestamp = x.Timestamp,
                Latitude = x.Latitude,
                Longitude = x.Longitude,
                Severity = CalculateSeverity(x.AccelerationY, HARSH_BRAKING_THRESHOLD, true),
                Speed = x.SpeedKmh,
                Description = $"Harsh braking: {x.AccelerationY:F2}g"
            })
            .ToList();

        // Analyze acceleration events
        analysis.HarshAccelerationEvents = data
            .Where(x => x.AccelerationY > HARSH_ACCELERATION_THRESHOLD)
            .Select(x => new DrivingEvent
            {
                Timestamp = x.Timestamp,
                Latitude = x.Latitude,
                Longitude = x.Longitude,
                Severity = CalculateSeverity(x.AccelerationY, HARSH_ACCELERATION_THRESHOLD, false),
                Speed = x.SpeedKmh,
                Description = $"Harsh acceleration: {x.AccelerationY:F2}g"
            })
            .ToList();

        // Analyze cornering events
        analysis.HarshCorneringEvents = data
            .Where(x => Math.Abs(x.AccelerationX) > HARSH_CORNERING_THRESHOLD)
            .Select(x => new DrivingEvent
            {
                Timestamp = x.Timestamp,
                Latitude = x.Latitude,
                Longitude = x.Longitude,
                Severity = CalculateSeverity(Math.Abs(x.AccelerationX), HARSH_CORNERING_THRESHOLD, false),
                Speed = x.SpeedKmh,
                Description = $"Harsh cornering: {x.AccelerationX:F2}g"
            })
            .ToList();

        // Analyze speeding (assuming urban for this example)
        analysis.SpeedingEvents = data
            .Where(x => x.SpeedKmh > SPEEDING_THRESHOLD_URBAN)
            .Select(x => new DrivingEvent
            {
                Timestamp = x.Timestamp,
                Latitude = x.Latitude,
                Longitude = x.Longitude,
                Severity = CalculateSpeedingSeverity(x.SpeedKmh, SPEEDING_THRESHOLD_URBAN),
                Speed = x.SpeedKmh,
                Description = $"Speeding: {x.SpeedKmh:F1} km/h (limit: {SPEEDING_THRESHOLD_URBAN} km/h)"
            })
            .ToList();

        // Analyze over-revving
        analysis.OverRevvingEvents = data
            .Where(x => x.EngineRpm > 5000)
            .Select(x => new DrivingEvent
            {
                Timestamp = x.Timestamp,
                Latitude = x.Latitude,
                Longitude = x.Longitude,
                Severity = CalculateRpmSeverity(x.EngineRpm),
                Speed = x.SpeedKmh,
                Description = $"Over-revving: {x.EngineRpm} RPM"
            })
            .ToList();

        // Calculate smooth driving percentage
        var totalEvents = analysis.HarshBrakingEvents.Count +
                        analysis.HarshAccelerationEvents.Count +
                        analysis.HarshCorneringEvents.Count;

        analysis.SmoothDrivingPercentage = 100.0 - ((totalEvents / (double)data.Count) * 100.0);

        return analysis;
    }

    private double CalculateDrivingScore(DrivingBehaviorAnalysis behavior)
    {
        // Start with perfect score
        double score = 100.0;

        // Deduct points for various infractions
        score -= behavior.HarshBrakingEvents.Count * 0.5;
        score -= behavior.HarshAccelerationEvents.Count * 0.5;
        score -= behavior.HarshCorneringEvents.Count * 0.3;
        score -= behavior.SpeedingEvents.Count * 1.0;
        score -= behavior.OverRevvingEvents.Count * 0.2;

        // Bonus for smooth driving
        if (behavior.SmoothDrivingPercentage > 95)
        {
            score += 5;
        }

        // Ensure score is between 0 and 100
        return Math.Max(0, Math.Min(100, score));
    }

    private RiskAssessment GenerateRiskAssessment(DrivingBehaviorAnalysis behavior, double drivingScore)
    {
        var assessment = new RiskAssessment
        {
            OverallRiskLevel = DetermineRiskLevel(drivingScore),
            InsurancePremiumMultiplier = CalculateInsurancePremiumMultiplier(drivingScore),
            AccidentRiskScore = CalculateAccidentRisk(behavior),
            VehicleDepreciationRate = CalculateDepreciationRate(behavior, drivingScore)
        };

        // Detailed risk factors
        assessment.RiskFactors = new List<string>();

        if (behavior.HarshBrakingEvents.Count > 10)
            assessment.RiskFactors.Add($"High frequency of harsh braking ({behavior.HarshBrakingEvents.Count} events)");

        if (behavior.HarshAccelerationEvents.Count > 15)
            assessment.RiskFactors.Add($"Aggressive acceleration patterns ({behavior.HarshAccelerationEvents.Count} events)");

        if (behavior.SpeedingEvents.Count > 5)
            assessment.RiskFactors.Add($"Frequent speeding violations ({behavior.SpeedingEvents.Count} events)");

        if (behavior.OverRevvingEvents.Count > 20)
            assessment.RiskFactors.Add($"Excessive engine stress ({behavior.OverRevvingEvents.Count} over-revving events)");

        if (behavior.SmoothDrivingPercentage < 85)
            assessment.RiskFactors.Add($"Below average smooth driving ({behavior.SmoothDrivingPercentage:F1}%)");

        // Positive factors
        assessment.PositiveFactors = new List<string>();

        if (behavior.SmoothDrivingPercentage > 95)
            assessment.PositiveFactors.Add($"Excellent smooth driving ({behavior.SmoothDrivingPercentage:F1}%)");

        if (behavior.HarshBrakingEvents.Count < 5)
            assessment.PositiveFactors.Add("Minimal harsh braking incidents");

        if (behavior.SpeedingEvents.Count == 0)
            assessment.PositiveFactors.Add("No speeding violations detected");

        return assessment;
    }

    private VehicleWearEstimate EstimateVehicleWear(List<VehicleSensorData> data, DrivingBehaviorAnalysis behavior)
    {
        return new VehicleWearEstimate
        {
            BrakeWearLevel = CalculateBrakeWear(behavior.HarshBrakingEvents.Count, data.Count),
            EngineWearLevel = CalculateEngineWear(behavior.OverRevvingEvents.Count, data),
            TireWearLevel = CalculateTireWear(behavior.HarshCorneringEvents.Count, behavior.HarshAccelerationEvents.Count),
            TransmissionStress = CalculateTransmissionStress(data),
            EstimatedMaintenanceCost = CalculateMaintenanceCost(behavior)
        };
    }

    private List<string> GenerateRecommendations(DrivingReport report)
    {
        var recommendations = new List<string>();

        if (report.DrivingBehavior.HarshBrakingEvents.Count > 10)
        {
            recommendations.Add("Samaziniet stingru bremzēšanu, uzturot drošu distanci un paredzot satiksmi");
        }

        if (report.DrivingBehavior.HarshAccelerationEvents.Count > 15)
        {
            recommendations.Add("Praktizējiet pakāpenisku paātrinājumu, lai uzlabotu degvielas efektivitāti un samazinātu nolietojumu");
        }

        if (report.DrivingBehavior.SpeedingEvents.Count > 5)
        {
            recommendations.Add("Ievērojiet ātruma ierobežojumus, lai samazinātu nelaimes gadījumu risku un apdrošināšanas izmaksas");
        }

        if (report.DrivingBehavior.OverRevvingEvents.Count > 20)
        {
            recommendations.Add("Pārslēdziet pārnesumus agrāk, lai samazinātu motora slodzi un uzlabotu ilgmūžību");
        }

        if (report.OverallDrivingScore >= 90)
        {
            recommendations.Add("Izcila braukšana! Jūs varētu kvalificēties samazinātām apdrošināšanas prēmijām");
        }
        else if (report.OverallDrivingScore < 70)
        {
            recommendations.Add("Apsveriet iespēju apmeklēt aizsardzības braukšanas kursus, lai uzlabotu drošību un samazinātu izmaksas");
        }

        if (report.VehicleWearEstimate.BrakeWearLevel > WearLevel.Moderate)
        {
            recommendations.Add("Ieplānojiet bremžu pārbaudi - braukšanas paradumi norāda uz paaugstinātu nolietojumu");
        }

        return recommendations;
    }

    // Helper methods for calculations
    private EventSeverity CalculateSeverity(double value, double threshold, bool isNegative)
    {
        var diff = isNegative ? Math.Abs(value) - Math.Abs(threshold) : value - threshold;

        if (diff < 0.1) return EventSeverity.Low;
        if (diff < 0.3) return EventSeverity.Medium;
        return EventSeverity.High;
    }

    private EventSeverity CalculateSpeedingSeverity(double speed, double limit)
    {
        var excess = speed - limit;
        if (excess < 10) return EventSeverity.Low;
        if (excess < 20) return EventSeverity.Medium;
        return EventSeverity.High;
    }

    private EventSeverity CalculateRpmSeverity(int rpm)
    {
        if (rpm < 5500) return EventSeverity.Low;
        if (rpm < 6000) return EventSeverity.Medium;
        return EventSeverity.High;
    }

    private RiskLevel DetermineRiskLevel(double score)
    {
        if (score >= 90) return RiskLevel.VeryLow;
        if (score >= 80) return RiskLevel.Low;
        if (score >= 70) return RiskLevel.Moderate;
        if (score >= 60) return RiskLevel.High;
        return RiskLevel.VeryHigh;
    }

    private double CalculateInsurancePremiumMultiplier(double score)
    {
        // Score 90-100: 0.8x (20% discount)
        // Score 80-89: 1.0x (standard)
        // Score 70-79: 1.2x (20% increase)
        // Score 60-69: 1.5x (50% increase)
        // Score <60: 2.0x (100% increase)

        if (score >= 90) return 0.8;
        if (score >= 80) return 1.0;
        if (score >= 70) return 1.2;
        if (score >= 60) return 1.5;
        return 2.0;
    }

    private double CalculateAccidentRisk(DrivingBehaviorAnalysis behavior)
    {
        // Score from 0-10, where 0 is no risk and 10 is extreme risk
        double risk = 0;

        risk += behavior.HarshBrakingEvents.Count * 0.1;
        risk += behavior.HarshAccelerationEvents.Count * 0.08;
        risk += behavior.HarshCorneringEvents.Count * 0.12;
        risk += behavior.SpeedingEvents.Count * 0.3;

        return Math.Min(10, risk);
    }

    private double CalculateDepreciationRate(DrivingBehaviorAnalysis behavior, double score)
    {
        // Annual depreciation rate as percentage
        double baseRate = 15.0; // Base 15% annual depreciation

        // Adjust based on driving behavior
        if (score < 70) baseRate += 5.0;
        if (behavior.OverRevvingEvents.Count > 50) baseRate += 2.0;
        if (behavior.HarshBrakingEvents.Count > 30) baseRate += 2.0;

        return Math.Min(30, baseRate); // Cap at 30%
    }

    private WearLevel CalculateBrakeWear(int harshBrakingCount, int totalDataPoints)
    {
        var rate = (harshBrakingCount / (double)totalDataPoints) * 100;

        if (rate < 1) return WearLevel.Low;
        if (rate < 3) return WearLevel.Moderate;
        if (rate < 5) return WearLevel.High;
        return WearLevel.Severe;
    }

    private WearLevel CalculateEngineWear(int overRevCount, List<VehicleSensorData> data)
    {
        var avgRpm = data.Average(x => x.EngineRpm);
        var rate = (overRevCount / (double)data.Count) * 100;

        if (avgRpm > 4000 || rate > 5) return WearLevel.High;
        if (avgRpm > 3500 || rate > 3) return WearLevel.Moderate;
        return WearLevel.Low;
    }

    private WearLevel CalculateTireWear(int corneringCount, int accelerationCount)
    {
        var totalStress = corneringCount + accelerationCount;

        if (totalStress < 10) return WearLevel.Low;
        if (totalStress < 30) return WearLevel.Moderate;
        if (totalStress < 50) return WearLevel.High;
        return WearLevel.Severe;
    }

    private double CalculateTransmissionStress(List<VehicleSensorData> data)
    {
        // Simplified: based on average RPM and throttle changes
        var avgRpm = data.Average(x => x.EngineRpm);
        var avgThrottle = data.Average(x => x.ThrottlePosition);

        return (avgRpm / 6000.0) * 50 + (avgThrottle / 100.0) * 50;
    }

    private decimal CalculateMaintenanceCost(DrivingBehaviorAnalysis behavior)
    {
        decimal baseCost = 500; // Base annual maintenance

        // Add costs for aggressive driving
        baseCost += behavior.HarshBrakingEvents.Count * 5;
        baseCost += behavior.HarshAccelerationEvents.Count * 3;
        baseCost += behavior.OverRevvingEvents.Count * 2;

        return baseCost;
    }

    private string DetermineConditionRating(double score)
    {
        if (score >= 90) return "Excellent";
        if (score >= 80) return "Good";
        if (score >= 70) return "Fair";
        if (score >= 60) return "Poor";
        return "Very Poor";
    }
}