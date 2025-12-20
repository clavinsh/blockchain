using Microsoft.AspNetCore.Mvc;
using backend.Services.Fabric;

namespace backend.Controllers;

/// <summary>
/// Controller for telemetry query operations
/// </summary>
[ApiController]
[Route("api/blockchain/query/telemetry")]
public class VehicleQueryController : ControllerBase
{
    private readonly IFabricClient _fabricClient;
    private readonly ILogger<VehicleQueryController> _logger;

    public VehicleQueryController(
        IFabricClient fabricClient,
        ILogger<VehicleQueryController> logger)
    {
        _fabricClient = fabricClient;
        _logger = logger;
    }

    /// <summary>
    /// Get all telemetry records from the blockchain
    /// Example: GET /api/blockchain/query/telemetry/all
    /// </summary>
    [HttpGet("all")]
    public async Task<ActionResult<List<VehicleTelemetry>>> GetAllTelemetry()
    {
        try
        {
            var telemetry = await _fabricClient.GetAllTelemetryAsync();
            return Ok(new { success = true, telemetry, count = telemetry.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get all telemetry");
            return StatusCode(500, new { error = "Failed to retrieve telemetry" });
        }
    }

    /// <summary>
    /// Get telemetry records inserted after a specific date
    /// Example: GET /api/blockchain/query/telemetry/after?date=2024-01-01
    /// </summary>
    [HttpGet("after")]
    public async Task<ActionResult<List<VehicleTelemetry>>> GetTelemetryAfter([FromQuery] DateTime date)
    {
        try
        {
            var telemetry = await _fabricClient.GetTelemetryAfterAsync(date);
            return Ok(new { success = true, telemetry, count = telemetry.Count, afterDate = date });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get telemetry after date");
            return StatusCode(500, new { error = "Failed to retrieve telemetry" });
        }
    }

    /// <summary>
    /// Get telemetry for a vehicle within a time range
    /// Example: GET /api/blockchain/query/telemetry/range?vehicleId=vehicle-001&startTime=2024-01-01&endTime=2024-12-31
    /// </summary>
    [HttpGet("range")]
    public async Task<ActionResult<List<VehicleTelemetry>>> GetTelemetryByTimeRange(
        [FromQuery] string vehicleId,
        [FromQuery] DateTime? startTime = null,
        [FromQuery] DateTime? endTime = null)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(vehicleId))
            {
                return BadRequest(new { error = "VehicleId is required" });
            }

            var telemetry = await _fabricClient.GetTelemetryByVehicleAndTimeRangeAsync(
                vehicleId, startTime, endTime);

            return Ok(new
            {
                success = true,
                telemetry,
                count = telemetry.Count,
                vehicleId,
                startTime,
                endTime
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get telemetry by time range");
            return StatusCode(500, new { error = "Failed to retrieve telemetry" });
        }
    }
}
