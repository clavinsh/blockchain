using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.DTOs;
using backend.Services;
using backend.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CarsController : ControllerBase
{
    private readonly CarService _carService;
    private readonly BlockchainDbContext _context;
    private readonly ILogger<CarsController> _logger;

    public CarsController(CarService carService, BlockchainDbContext context, ILogger<CarsController> logger)
    {
        _carService = carService;
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<GetUserCarsResponse>> GetUserCars()
    {
        try
        {
            // Log all claims for debugging
            _logger.LogInformation("User claims: {Claims}",
                string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));

            // Extract user ID from JWT token - try multiple claim types for compatibility
            var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                           ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                _logger.LogWarning("Failed to extract user ID from token. Sub claim value: {SubClaim}, All claims: {AllClaims}",
                    userIdClaim,
                    string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));
                return Unauthorized(new GetUserCarsResponse
                {
                    Success = false,
                    Message = "Nederīgs autentifikācijas tokens"
                });
            }

            var cars = await _carService.GetUserCarsAsync(userId);

            return Ok(new GetUserCarsResponse
            {
                Success = true,
                Message = "Mašīnas iegūtas veiksmīgi",
                Cars = cars
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user cars");
            return StatusCode(500, new GetUserCarsResponse
            {
                Success = false,
                Message = "Servera kļūda"
            });
        }
    }

    [HttpGet("{carId}")]
    public async Task<ActionResult> GetCarById(int carId)
    {
        try
        {
            // Extract user ID from JWT token - try multiple claim types for compatibility
            var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                           ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { success = false, message = "Nederīgs autentifikācijas tokens" });
            }

            // Check if user has access to this car
            var hasAccess = await _carService.UserHasAccessToCarAsync(userId, carId);
            if (!hasAccess)
            {
                return Forbid();
            }

            var car = await _carService.GetCarByIdAsync(carId);

            if (car == null)
            {
                return NotFound(new { success = false, message = "Mašīna nav atrasta" });
            }

            return Ok(new { success = true, car });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching car {CarId}", carId);
            return StatusCode(500, new { success = false, message = "Servera kļūda" });
        }
    }

    [HttpGet("{carId}/data")]
    public async Task<ActionResult<GetCarDataResponse>> GetCarData(int carId, [FromQuery] int limit = 20)
    {
        try
        {
            // Extract user ID from JWT token
            var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                           ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new GetCarDataResponse
                {
                    Success = false,
                    Message = "Nederīgs autentifikācijas tokens"
                });
            }

            // Check if user has access to this car
            var hasAccess = await _carService.UserHasAccessToCarAsync(userId, carId);
            if (!hasAccess)
            {
                return Forbid();
            }

            var carData = await _carService.GetCarDataAsync(carId, limit);

            return Ok(new GetCarDataResponse
            {
                Success = true,
                Message = "Dati iegūti veiksmīgi",
                Data = carData
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching car data for car {CarId}", carId);
            return StatusCode(500, new GetCarDataResponse
            {
                Success = false,
                Message = "Servera kļūda"
            });
        }
    }

    [HttpPost]
    public async Task<ActionResult<CreateCarResponse>> CreateCar([FromBody] CreateCarRequest request)
    {
        try
        {
            // Extract user ID from JWT token
            var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                           ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new CreateCarResponse
                {
                    Success = false,
                    Message = "Nederīgs autentifikācijas tokens"
                });
            }

            var carId = await _carService.CreateCarAsync(request, userId);

            return Ok(new CreateCarResponse
            {
                Success = true,
                Message = "Mašīna izveidota veiksmīgi",
                CarId = carId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating car");
            return StatusCode(500, new CreateCarResponse
            {
                Success = false,
                Message = "Servera kļūda"
            });
        }
    }

    [HttpPut("{carId}")]
    public async Task<ActionResult<UpdateCarResponse>> UpdateCar(int carId, [FromBody] UpdateCarRequest request)
    {
        try
        {
            // Extract user ID from JWT token
            var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                           ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new UpdateCarResponse
                {
                    Success = false,
                    Message = "Nederīgs autentifikācijas tokens"
                });
            }

            // Check if user has access to this car
            var hasAccess = await _carService.UserHasAccessToCarAsync(userId, carId);
            if (!hasAccess)
            {
                return Forbid();
            }

            var success = await _carService.UpdateCarAsync(carId, request);

            if (!success)
            {
                return NotFound(new UpdateCarResponse
                {
                    Success = false,
                    Message = "Mašīna nav atrasta"
                });
            }

            return Ok(new UpdateCarResponse
            {
                Success = true,
                Message = "Mašīna atjaunināta veiksmīgi"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating car {CarId}", carId);
            return StatusCode(500, new UpdateCarResponse
            {
                Success = false,
                Message = "Servera kļūda"
            });
        }
    }

    [HttpDelete("{carId}")]
    public async Task<ActionResult<DeleteCarResponse>> DeleteCar(int carId)
    {
        try
        {
            // Extract user ID from JWT token
            var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                           ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new DeleteCarResponse
                {
                    Success = false,
                    Message = "Nederīgs autentifikācijas tokens"
                });
            }

            // Check if user has access to this car
            var hasAccess = await _carService.UserHasAccessToCarAsync(userId, carId);
            if (!hasAccess)
            {
                return Forbid();
            }

            var success = await _carService.DeleteCarAsync(carId);

            if (!success)
            {
                return NotFound(new DeleteCarResponse
                {
                    Success = false,
                    Message = "Mašīna nav atrasta"
                });
            }

            return Ok(new DeleteCarResponse
            {
                Success = true,
                Message = "Mašīna dzēsta veiksmīgi"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting car {CarId}", carId);
            return StatusCode(500, new DeleteCarResponse
            {
                Success = false,
                Message = "Servera kļūda"
            });
        }
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

    [HttpGet("{carId}/users")]
    public async Task<ActionResult> GetCarUsers(int carId)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { success = false, message = "Invalid authentication token" });
        }

        // Check if user has access to this car
        var hasAccess = await _carService.UserHasAccessToCarAsync(userId.Value, carId);
        if (!hasAccess)
        {
            return Forbid();
        }

        var users = await _context.Users2Cars
            .Include(uc => uc.User)
            .Where(uc => uc.CarId == carId)
            .Select(uc => new
            {
                id = uc.Id,
                userId = uc.UserId,
                username = uc.User.Username,
                email = uc.User.Email,
                firstName = uc.User.FirstName,
                lastName = uc.User.LastName,
                roleCode = uc.RoleCode,
                assignedAt = uc.AssignedAt
            })
            .ToListAsync();

        return Ok(new { success = true, users });
    }

    [HttpDelete("{carId}/users/{userCarId}")]
    public async Task<ActionResult> RemoveCarUser(int carId, int userCarId)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { success = false, message = "Invalid authentication token" });
        }

        // Check if current user has access to this car and verify they are an OWNER
        var currentUserCarRelation = await _context.Users2Cars
            .FirstOrDefaultAsync(uc => uc.UserId == userId.Value && uc.CarId == carId);

        if (currentUserCarRelation == null)
        {
            return Forbid();
        }

        // Only OWNER role can remove users
        if (currentUserCarRelation.RoleCode != "OWNER")
        {
            return StatusCode(403, new { success = false, message = "Only owners can remove users from the car" });
        }

        // Get the user-car relation to remove
        var userCarRelation = await _context.Users2Cars
            .FirstOrDefaultAsync(uc => uc.Id == userCarId && uc.CarId == carId);

        if (userCarRelation == null)
        {
            return NotFound(new { success = false, message = "User access not found" });
        }

        // Prevent user from removing themselves
        if (userCarRelation.UserId == userId)
        {
            return BadRequest(new { success = false, message = "Cannot remove your own access" });
        }

        _context.Users2Cars.Remove(userCarRelation);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "User access removed successfully" });
    }
}
