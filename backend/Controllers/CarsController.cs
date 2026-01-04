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
                    Message = "Invalid authentication token"
                });
            }

            var cars = await _carService.GetUserCarsAsync(userId);

            return Ok(new GetUserCarsResponse
            {
                Success = true,
                Message = "Cars retrieved successfully",
                Cars = cars
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user cars");
            return StatusCode(500, new GetUserCarsResponse
            {
                Success = false,
                Message = "Server error"
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
                return Unauthorized(new { success = false, message = "Invalid authentication token" });
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
                return NotFound(new { success = false, message = "Car not found" });
            }

            return Ok(new { success = true, car });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching car {CarId}", carId);
            return StatusCode(500, new { success = false, message = "Server error" });
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
                    Message = "Invalid authentication token"
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
                Message = "Data retrieved successfully",
                Data = carData
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching car data for car {CarId}", carId);
            return StatusCode(500, new GetCarDataResponse
            {
                Success = false,
                Message = "Server error"
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
                    Message = "Invalid authentication token"
                });
            }

            var carId = await _carService.CreateCarAsync(request, userId);

            return Ok(new CreateCarResponse
            {
                Success = true,
                Message = "Car created successfully",
                CarId = carId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating car");
            
            // Check for specific database constraint violations
            string errorMessage = "Server error";
            
            // Get the full exception message including inner exceptions
            string fullMessage = ex.ToString();
            
            // Try to detect ANY constraint violation first with broader detection
            if (fullMessage.ToLower().Contains("constraint") || 
                fullMessage.ToLower().Contains("unique") || 
                fullMessage.ToLower().Contains("duplicate") ||
                fullMessage.ToLower().Contains("sqlite") ||
                fullMessage.ToLower().Contains("index"))
            {
                // Default constraint violation message
                errorMessage = "This data is already used by another car";
                
                // Check for specific constraint keys to identify the exact field
                if (fullMessage.Contains("'CarTable.VIN'") || fullMessage.Contains("key 'VIN'"))
                {
                    errorMessage = "This VIN code is already used by another car";
                }
                else if (fullMessage.Contains("'CarTable.LicensePlate'") || fullMessage.Contains("key 'LicensePlate'"))
                {
                    errorMessage = "This license plate is already used by another car";
                }
                // Fallback to checking field names in the exception message
                else if (fullMessage.ToLower().Contains("vin") && !fullMessage.ToLower().Contains("licenseplate"))
                {
                    errorMessage = "This VIN code is already used by another car";
                }
                else if (fullMessage.ToLower().Contains("licenseplate") || fullMessage.ToLower().Contains("license"))
                {
                    errorMessage = "This license plate is already used by another car";
                }
            }
            else if (fullMessage.Contains("validation") || fullMessage.Contains("invalid"))
            {
                errorMessage = "Invalid input data";
            }
            
            _logger.LogInformation("Returning error message: {ErrorMessage} for exception: {Exception}", errorMessage, fullMessage);
            
            return StatusCode(500, new CreateCarResponse
            {
                Success = false,
                Message = errorMessage
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
                    Message = "Invalid authentication token"
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
                    Message = "Car not found"
                });
            }

            return Ok(new UpdateCarResponse
            {
                Success = true,
                Message = "Car updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating car {CarId}", carId);
            
            // Check for specific database constraint violations
            string errorMessage = "Server error";
            
            // Get the full exception message including inner exceptions
            string fullMessage = ex.ToString();
            
            // Try to detect ANY constraint violation first with broader detection
            if (fullMessage.ToLower().Contains("constraint") || 
                fullMessage.ToLower().Contains("unique") || 
                fullMessage.ToLower().Contains("duplicate") ||
                fullMessage.ToLower().Contains("sqlite") ||
                fullMessage.ToLower().Contains("index"))
            {
                // Default constraint violation message
                errorMessage = "This data is already used by another car";
                
                // Check for specific constraint keys to identify the exact field
                if (fullMessage.Contains("'CarTable.VIN'") || fullMessage.Contains("key 'VIN'"))
                {
                    errorMessage = "This VIN code is already used by another car";
                }
                else if (fullMessage.Contains("'CarTable.LicensePlate'") || fullMessage.Contains("key 'LicensePlate'"))
                {
                    errorMessage = "This license plate is already used by another car";
                }
                // Fallback to checking field names in the exception message
                else if (fullMessage.ToLower().Contains("vin") && !fullMessage.ToLower().Contains("licenseplate"))
                {
                    errorMessage = "This VIN code is already used by another car";
                }
                else if (fullMessage.ToLower().Contains("licenseplate") || fullMessage.ToLower().Contains("license"))
                {
                    errorMessage = "This license plate is already used by another car";
                }
            }
            else if (fullMessage.Contains("validation") || fullMessage.Contains("invalid"))
            {
                errorMessage = "Invalid input data";
            }
            
            return StatusCode(500, new UpdateCarResponse
            {
                Success = false,
                Message = errorMessage
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

    [HttpPost("{carId}/transfer-ownership")]
    public async Task<ActionResult<TransferOwnershipResponse>> TransferOwnership(int carId, [FromBody] TransferOwnershipRequest request)
    {
        try
        {
            // Extract user ID from JWT token
            var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                           ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new TransferOwnershipResponse
                {
                    Success = false,
                    Message = "Invalid authentication token"
                });
            }

            // Validate input
            if (string.IsNullOrWhiteSpace(request.NewOwnerEmail))
            {
                return BadRequest(new TransferOwnershipResponse
                {
                    Success = false,
                    Message = "New owner's email address is required"
                });
            }

// Check if current user is OWNER
        var isOwner = await _carService.IsOwnerAsync(userId, carId);
        if (!isOwner)
            {
                return Forbid();
            }

            // Find new owner by email
            var newOwner = await _carService.GetUserByEmailAsync(request.NewOwnerEmail);
            if (newOwner == null)
            {
                return NotFound(new TransferOwnershipResponse
                {
                    Success = false,
                    Message = "User with this email address does not exist"
                });
            }

            // Prevent transferring to self
            if (newOwner.UserId == userId)
            {
                return BadRequest(new TransferOwnershipResponse
                {
                    Success = false,
                    Message = "Cannot transfer ownership to yourself"
                });
            }

            // Transfer ownership
            var success = await _carService.TransferOwnershipAsync(carId, userId, newOwner.UserId);
            
            if (!success)
            {
                return StatusCode(500, new TransferOwnershipResponse
                {
                    Success = false,
                    Message = "Failed to transfer ownership"
                });
            }

            return Ok(new TransferOwnershipResponse
            {
                Success = true,
                Message = $"Ownership successfully transferred to user {request.NewOwnerEmail}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error transferring ownership of car {CarId}", carId);
            
            return StatusCode(500, new TransferOwnershipResponse
            {
                Success = false,
                Message = "Server error. Please try again later"
            });
        }
    }

    [HttpPost("{carId}/change-role")]
    public async Task<ActionResult<ChangeUserRoleResponse>> ChangeUserRole(int carId, [FromBody] ChangeUserRoleRequest request)
    {
        try
        {
            // Extract user ID from JWT token
            var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                           ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new ChangeUserRoleResponse
                {
                    Success = false,
                    Message = "Invalid authentication token"
                });
            }

            // Validate input
            if (request.UserId <= 0 || string.IsNullOrWhiteSpace(request.NewRole))
            {
                return BadRequest(new ChangeUserRoleResponse
                {
                    Success = false,
                    Message = "Invalid input data"
                });
            }

            // Change the role
            var success = await _carService.ChangeUserRoleAsync(carId, userId, request.UserId, request.NewRole.ToUpper());
            
            if (!success)
            {
                return BadRequest(new ChangeUserRoleResponse
                {
                    Success = false,
                    Message = "Failed to change user role"
                });
            }

            return Ok(new ChangeUserRoleResponse
            {
                Success = true,
                Message = $"User role successfully changed to {request.NewRole}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing user role for car {CarId}", carId);
            
            return StatusCode(500, new ChangeUserRoleResponse
            {
                Success = false,
                Message = "Server error. Please try again later"
            });
        }
    }

    [HttpPost("{carId}/assign-viewer")]
    public async Task<ActionResult<AssignViewerResponse>> AssignViewer(int carId, [FromBody] AssignViewerRequest request)
    {
        try
        {
            // Extract user ID from JWT token
            var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                           ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new AssignViewerResponse
                {
                    Success = false,
                    Message = "Invalid authentication token"
                });
            }

            // Validate input
            if (string.IsNullOrWhiteSpace(request.ViewerEmail))
            {
                return BadRequest(new AssignViewerResponse
                {
                    Success = false,
                    Message = "Viewer's email address is required"
                });
            }

            // Assign viewer role
            var success = await _carService.AssignViewerRoleAsync(carId, userId, request.ViewerEmail);
            
            if (!success)
            {
                return BadRequest(new AssignViewerResponse
                {
                    Success = false,
                    Message = "Failed to assign viewer role"
                });
            }

            return Ok(new AssignViewerResponse
            {
                Success = true,
                Message = $"Viewer role successfully assigned to user {request.ViewerEmail}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning viewer role for car {CarId}", carId);
            
            return StatusCode(500, new AssignViewerResponse
            {
                Success = false,
                Message = "Server error. Please try again later"
            });
        }
    }

    [HttpDelete("{carId}/users/{targetUserId}")]
    public async Task<ActionResult> RemoveUserAccess(int carId, int targetUserId)
    {
        try
        {
            // Extract user ID from JWT token
            var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                           ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { success = false, message = "Invalid authentication token" });
            }

            // Remove user access
            var success = await _carService.RemoveUserAccessAsync(carId, userId, targetUserId);
            
            if (!success)
            {
                return BadRequest(new { success = false, message = "Failed to remove user access" });
            }

            return Ok(new { success = true, message = "User access successfully removed" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing user access for car {CarId}", carId);
            
            return StatusCode(500, new { success = false, message = "Server error. Please try again later" });
        }
    }

    [HttpDelete("{carId}")]
    public async Task<ActionResult> DeleteCar(int carId)
    {
        try
        {
            // Extract user ID from JWT token
            var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                           ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { success = false, message = "Invalid authentication token" });
            }

// Check if user is OWNER of this car
        var userCarRelation = await _context.Users2Cars
            .FirstOrDefaultAsync(uc => uc.UserId == userId && uc.CarId == carId);

        if (userCarRelation == null || userCarRelation.RoleCode != "OWNER")
        {
            return StatusCode(403, new { success = false, message = "Only owner can delete car" });
            }

            // Delete all related data
            // 1. Remove all user access
            var allUserAccess = await _context.Users2Cars
                .Where(uc => uc.CarId == carId)
                .ToListAsync();
            _context.Users2Cars.RemoveRange(allUserAccess);

            // 2. Remove all invites
            var allInvites = await _context.CarInvites
                .Where(ci => ci.CarId == carId)
                .ToListAsync();
            _context.CarInvites.RemoveRange(allInvites);

            // 3. Remove car data cache
            var carDataCache = await _context.CarDataCaches
                .Where(cdc => cdc.CarId == carId)
                .ToListAsync();
            _context.CarDataCaches.RemoveRange(carDataCache);

            // 4. Finally, delete the car
            var car = await _context.CarTables.FindAsync(carId);
            if (car != null)
            {
                _context.CarTables.Remove(car);
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Car and all related data deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting car {CarId}", carId);
            return StatusCode(500, new { success = false, message = "Server error deleting car" });
        }
    }
}
