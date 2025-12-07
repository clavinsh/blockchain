using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TelemetryController : ControllerBase
{
    private readonly TelemetryDataService _telemetryService;
    private readonly ILogger<TelemetryController> _logger;

    public TelemetryController(
        TelemetryDataService telemetryService,
        ILogger<TelemetryController> logger)
    {
        _telemetryService = telemetryService;
        _logger = logger;
    }

    /// <summary>
    /// Generate a comprehensive driving behavior report
    /// </summary>
    [HttpGet("report")]
    public async Task<ActionResult<DrivingReport>> GetReport(
        [FromQuery] int carId,
        [FromQuery] DateTime from,
        [FromQuery] DateTime to)
    {
        try
        {
            var report = await _telemetryService.GenerateReportAsync(carId, from, to);
            return Ok(report);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating driving report for car {CarId}", carId);
            return StatusCode(500, new { message = "An error occurred while generating the report" });
        }
    }

    /// <summary>
    /// Generate an insurance summary report
    /// </summary>
    [HttpGet("insurance-summary")]
    public async Task<ActionResult<InsuranceSummary>> GetInsuranceSummary(
        [FromQuery] int carId,
        [FromQuery] DateTime from,
        [FromQuery] DateTime to)
    {
        try
        {
            var summary = await _telemetryService.GenerateInsuranceSummaryAsync(carId, from, to);
            return Ok(summary);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating insurance summary for car {CarId}", carId);
            return StatusCode(500, new { message = "An error occurred while generating the insurance summary" });
        }
    }

    /// <summary>
    /// Generate a reseller summary report
    /// </summary>
    [HttpGet("reseller-summary")]
    public async Task<ActionResult<ResellerSummary>> GetResellerSummary(
        [FromQuery] int carId,
        [FromQuery] DateTime from,
        [FromQuery] DateTime to)
    {
        try
        {
            var summary = await _telemetryService.GenerateResellerSummaryAsync(carId, from, to);
            return Ok(summary);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating reseller summary for car {CarId}", carId);
            return StatusCode(500, new { message = "An error occurred while generating the reseller summary" });
        }
    }

    /// <summary>
    /// Get route data with GPS coordinates and speed for map visualization
    /// </summary>
    [HttpGet("route")]
    public async Task<ActionResult<backend.DTOs.RouteData>> GetRoute(
        [FromQuery] int carId,
        [FromQuery] DateTime from,
        [FromQuery] DateTime to)
    {
        try
        {
            var routeData = await _telemetryService.GetRouteDataAsync(carId, from, to);
            return Ok(routeData);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching route data for car {CarId}", carId);
            return StatusCode(500, new { message = "An error occurred while fetching the route data" });
        }
    }
}
