using backend.Services.Fabric;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

/// <summary>
/// Controller for blockchain telemetry operations
/// </summary>
[ApiController]
[Route("api/blockchain/telemetry")]
public class BlockchainVehicleController : ControllerBase
{
    private readonly ITelemetryService _telemetryService;
    private readonly ILogger<BlockchainVehicleController> _logger;

    public BlockchainVehicleController(
        ITelemetryService telemetryService,
        ILogger<BlockchainVehicleController> logger)
    {
        _telemetryService = telemetryService;
        _logger = logger;
    }

    /// <summary>
    /// Submit telemetry data to the blockchain
    /// </summary>
    [HttpPost("submit")]
    public async Task<ActionResult<FabricResponse>> SubmitTelemetry(
        [FromBody] SubmitTelemetryRequest request)
    {
        try
        {
            var response = await _telemetryService.SubmitTelemetryAsync(request);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to submit telemetry");
            return StatusCode(500, new { error = "Failed to submit telemetry", details = ex.Message });
        }
    }

    /// <summary>
    /// Get all telemetry records for a specific vehicle
    /// </summary>
    [HttpGet("vehicle/{carId}")]
    public async Task<ActionResult<List<VehicleTelemetry>>> GetTelemetryByVehicle(string carId)
    {
        try
        {
            var telemetry = await _telemetryService.GetTelemetryByVehicleAsync(carId);
            return Ok(new { success = true, telemetry, count = telemetry.Count });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get telemetry for vehicle {CarId}", carId);
            return StatusCode(500, new { error = "Failed to retrieve telemetry", details = ex.Message });
        }
    }
}
