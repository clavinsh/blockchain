namespace backend.Services.Fabric;

/// <summary>
/// Service for telemetry-related blockchain operations
/// </summary>
public class TelemetryService
{
    private readonly FabricClient _fabricClient;
    private readonly ILogger<TelemetryService> _logger;

    public TelemetryService(FabricClient fabricClient, ILogger<TelemetryService> logger)
    {
        _fabricClient = fabricClient;
        _logger = logger;
    }

    public async Task<FabricResponse> SubmitTelemetryAsync(SubmitTelemetryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CarId))
        {
            throw new ArgumentException("CarId is required", nameof(request.CarId));
        }

        if (string.IsNullOrWhiteSpace(request.CarData))
        {
            throw new ArgumentException("CarData is required", nameof(request.CarData));
        }

        try
        {
            _logger.LogInformation(
                "Submitting telemetry data for vehicle {CarId}",
                request.CarId);

            var result = await _fabricClient.SubmitTelemetryAsync(
                request.CarId,
                request.CarData);

            _logger.LogInformation(
                "Successfully submitted telemetry data for vehicle {CarId}",
                request.CarId);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to submit telemetry data for vehicle {CarId}",
                request.CarId);
            throw;
        }
    }

    public async Task<List<VehicleTelemetry>> GetTelemetryByVehicleAsync(string carId)
    {
        if (string.IsNullOrWhiteSpace(carId))
        {
            throw new ArgumentException("CarId is required", nameof(carId));
        }

        try
        {
            _logger.LogInformation("Retrieving telemetry for vehicle {CarId}", carId);

            var response = await _fabricClient.GetTelemetryByVehicleAsync(carId);

            _logger.LogInformation(
                "Successfully retrieved {Count} telemetry records for vehicle {CarId}",
                response.Count,
                carId);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve telemetry for vehicle {CarId}", carId);
            throw;
        }
    }

    public async Task<List<VehicleTelemetry>> GetAllTelemetryAsync()
    {
        try
        {
            _logger.LogInformation("Retrieving all telemetry records from blockchain");

            var response = await _fabricClient.GetAllTelemetryAsync();

            _logger.LogInformation(
                "Successfully retrieved {Count} total telemetry records",
                response.Count);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve all telemetry records");
            throw;
        }
    }

    public async Task<List<VehicleTelemetry>> GetTelemetryAfterDateAsync(DateTime timestamp)
    {
        try
        {
            _logger.LogInformation(
                "Retrieving telemetry records after {Timestamp}",
                timestamp);

            var response = await _fabricClient.GetTelemetryAfterAsync(timestamp);

            _logger.LogInformation(
                "Successfully retrieved {Count} telemetry records after {Timestamp}",
                response.Count,
                timestamp);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to retrieve telemetry records after {Timestamp}",
                timestamp);
            throw;
        }
    }

    public async Task<List<VehicleTelemetry>> GetTelemetryByVehicleAndTimeRangeAsync(
        string carId, DateTime? startTime, DateTime? endTime)
    {
        if (string.IsNullOrWhiteSpace(carId))
        {
            throw new ArgumentException("CarId is required", nameof(carId));
        }

        try
        {
            _logger.LogInformation(
                "Retrieving telemetry for vehicle {CarId} from {StartTime} to {EndTime}",
                carId,
                startTime,
                endTime);

            var response = await _fabricClient.GetTelemetryByVehicleAndTimeRangeAsync(
                carId, startTime, endTime);

            _logger.LogInformation(
                "Successfully retrieved {Count} telemetry records for vehicle {CarId} in time range",
                response.Count,
                carId);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to retrieve telemetry for vehicle {CarId} in time range",
                carId);
            throw;
        }
    }
}

public record SubmitTelemetryRequest(string CarId, string CarData);
