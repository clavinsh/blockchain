using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.DTOs;
using backend.Models;
using backend.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TelemetryController : ControllerBase
{
    private readonly TelemetryDataService _telemetryService;
    private readonly BlockchainDbContext _context;
    private readonly ILogger<TelemetryController> _logger;

    public TelemetryController(
        TelemetryDataService telemetryService,
        BlockchainDbContext context,
        ILogger<TelemetryController> logger)
    {
        _telemetryService = telemetryService;
        _context = context;
        _logger = logger;
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                       ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return null;
        }

        return userId;
    }

    private async Task<(bool hasAccess, string? roleCode)> CheckCarAccessAsync(int userId, int carId)
    {
        var userCarRelation = await _context.Users2Cars
            .FirstOrDefaultAsync(uc => uc.UserId == userId && uc.CarId == carId);

        if (userCarRelation == null)
        {
            return (false, null);
        }

        return (true, userCarRelation.RoleCode);
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
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(new { message = "Invalid authentication token" });
            }

            var (hasAccess, roleCode) = await CheckCarAccessAsync(userId.Value, carId);

            if (!hasAccess)
            {
                return Forbid();
            }

            // VIEWER role cannot access driving reports
            if (roleCode == "VIEWER")
            {
                return StatusCode(403, new { message = "Viewers do not have access to driving reports" });
            }

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
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(new { message = "Invalid authentication token" });
            }

            var (hasAccess, roleCode) = await CheckCarAccessAsync(userId.Value, carId);

            if (!hasAccess)
            {
                return Forbid();
            }

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
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(new { message = "Invalid authentication token" });
            }

            var (hasAccess, roleCode) = await CheckCarAccessAsync(userId.Value, carId);

            if (!hasAccess)
            {
                return Forbid();
            }

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
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(new { message = "Invalid authentication token" });
            }

            var (hasAccess, roleCode) = await CheckCarAccessAsync(userId.Value, carId);

            if (!hasAccess)
            {
                return Forbid();
            }

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
