using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.DTOs;

namespace backend.Services;

public class CarService
{
    private readonly BlockchainDbContext _context;
    private readonly ILogger<CarService> _logger;

    public CarService(BlockchainDbContext context, ILogger<CarService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<UserCarDto>> GetUserCarsAsync(int userId)
    {
        try
        {
            var userCars = await _context.Users2Cars
                .Where(u2c => u2c.UserId == userId)
                .Include(u2c => u2c.Car)
                .Select(u2c => new UserCarDto
                {
                    CarId = u2c.Car.CarId,
                    Brand = u2c.Car.Brand,
                    Model = u2c.Car.Model,
                    Year = u2c.Car.Year,
                    LicensePlate = u2c.Car.LicensePlate ?? "",
                    Vin = u2c.Car.Vin,
                    Color = u2c.Car.Color,
                    Mileage = u2c.Car.Mileage ?? 0,
                    AssignedAt = u2c.AssignedAt,
                    RoleCode = u2c.RoleCode
                })
                .ToListAsync();

            return userCars;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching cars for user {UserId}", userId);
            throw;
        }
    }

    public async Task<CarTable?> GetCarByIdAsync(int carId)
    {
        return await _context.CarTables
            .FirstOrDefaultAsync(c => c.CarId == carId);
    }

    public async Task<bool> UserHasAccessToCarAsync(int userId, int carId)
    {
        return await _context.Users2Cars
            .AnyAsync(u2c => u2c.UserId == userId && u2c.CarId == carId);
    }

    public async Task<List<CarDataDto>> GetCarDataAsync(int carId, int limit = 20)
    {
        try
        {
            var carData = await _context.CarDataCaches
                .Where(c => c.CarId == carId && c.DeleteTime == null)
                .OrderByDescending(c => c.InsertTime)
                .Take(limit)
                .Select(c => new CarDataDto
                {
                    Id = c.Id,
                    CarId = c.CarId,
                    CarData = c.CarData,
                    InsertTime = c.InsertTime
                })
                .ToListAsync();

            return carData;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching car data for car {CarId}", carId);
            throw;
        }
    }

    public async Task<int> CreateCarAsync(CreateCarRequest request, int userId)
    {
        try
        {
            var car = new CarTable
            {
                Brand = request.Brand,
                Model = request.Model,
                Year = request.Year,
                LicensePlate = request.LicensePlate,
                Vin = request.Vin,
                Color = request.Color,
                Mileage = request.Mileage,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CarTables.Add(car);
            await _context.SaveChangesAsync();

            // Assign car to user
            var users2Car = new Users2Car
            {
                UserId = userId,
                CarId = car.CarId,
                RoleCode = "MASTER_OWNER",
                AssignedAt = DateTime.UtcNow
            };

            _context.Users2Cars.Add(users2Car);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created car {CarId} for user {UserId}", car.CarId, userId);
            return car.CarId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating car for user {UserId}", userId);
            throw;
        }
    }

    public async Task<bool> UpdateCarAsync(int carId, UpdateCarRequest request)
    {
        try
        {
            var car = await _context.CarTables.FindAsync(carId);

            if (car == null)
            {
                return false;
            }

            if (!string.IsNullOrEmpty(request.Brand))
                car.Brand = request.Brand;

            if (!string.IsNullOrEmpty(request.Model))
                car.Model = request.Model;

            if (request.Year.HasValue)
                car.Year = request.Year.Value;

            if (request.LicensePlate != null)
                car.LicensePlate = request.LicensePlate;

            if (request.Vin != null)
                car.Vin = request.Vin;

            if (request.Color != null)
                car.Color = request.Color;

            if (request.Mileage.HasValue)
                car.Mileage = request.Mileage;

            car.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated car {CarId}", carId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating car {CarId}", carId);
            throw;
        }
    }

    public async Task<bool> DeleteCarAsync(int carId)
    {
        try
        {
            var car = await _context.CarTables.FindAsync(carId);

            if (car == null)
            {
                return false;
            }

            // Remove associated Users2Cars relationships
            var users2Cars = _context.Users2Cars.Where(u2c => u2c.CarId == carId);
            _context.Users2Cars.RemoveRange(users2Cars);

            // Remove the car
            _context.CarTables.Remove(car);

            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted car {CarId}", carId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting car {CarId}", carId);
            throw;
        }
    }

    public async Task<bool> TransferOwnershipAsync(int carId, int currentMasterOwnerId, int newMasterOwnerId)
    {
        try
        {
            // Check if current user is MASTER_OWNER of the car
            var currentOwnerRelation = await _context.Users2Cars
                .FirstOrDefaultAsync(uc => uc.CarId == carId && uc.UserId == currentMasterOwnerId && uc.RoleCode == "MASTER_OWNER");

            if (currentOwnerRelation == null)
            {
                _logger.LogWarning("User {UserId} is not MASTER_OWNER of car {CarId}", currentMasterOwnerId, carId);
                return false;
            }

            // Check if new owner exists
            var newOwnerUser = await _context.UserTables.FindAsync(newMasterOwnerId);
            if (newOwnerUser == null)
            {
                _logger.LogWarning("New owner user {UserId} does not exist", newMasterOwnerId);
                return false;
            }

            // Check if new owner already has access to this car
            var existingRelation = await _context.Users2Cars
                .FirstOrDefaultAsync(uc => uc.CarId == carId && uc.UserId == newMasterOwnerId);

            if (existingRelation != null)
            {
                // Update existing relation to MASTER_OWNER
                existingRelation.RoleCode = "MASTER_OWNER";
                existingRelation.AssignedAt = DateTime.UtcNow;
            }
            else
            {
                // Create new MASTER_OWNER relation for new owner
                var newOwnerRelation = new Users2Car
                {
                    UserId = newMasterOwnerId,
                    CarId = carId,
                    RoleCode = "MASTER_OWNER",
                    AssignedAt = DateTime.UtcNow
                };
                _context.Users2Cars.Add(newOwnerRelation);
            }

            // Update current MASTER_OWNER to OWNER
            currentOwnerRelation.RoleCode = "OWNER";
            currentOwnerRelation.AssignedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Transferred ownership of car {CarId} from user {OldOwnerId} to user {NewOwnerId}", 
                carId, currentMasterOwnerId, newMasterOwnerId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error transferring ownership of car {CarId}", carId);
            throw;
        }
    }

    public async Task<bool> IsMasterOwnerAsync(int userId, int carId)
    {
        return await _context.Users2Cars
            .AnyAsync(uc => uc.UserId == userId && uc.CarId == carId && uc.RoleCode == "MASTER_OWNER");
    }

    public async Task<UserTable?> GetUserByEmailAsync(string email)
    {
        return await _context.UserTables
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<bool> ChangeUserRoleAsync(int carId, int requesterId, int targetUserId, string newRole)
    {
        try
        {
            // Validate new role
            var validRoles = new[] { "OWNER", "VIEWER" };
            if (!validRoles.Contains(newRole))
            {
                _logger.LogWarning("Invalid role: {Role}", newRole);
                return false;
            }

            // Check if requester has permission (must be MASTER_OWNER or OWNER)
            var requesterRelation = await _context.Users2Cars
                .FirstOrDefaultAsync(uc => uc.CarId == carId && uc.UserId == requesterId);

            if (requesterRelation == null || (requesterRelation.RoleCode != "MASTER_OWNER" && requesterRelation.RoleCode != "OWNER"))
            {
                _logger.LogWarning("User {RequesterId} does not have permission to change roles for car {CarId}", requesterId, carId);
                return false;
            }

            // Find target user's relation to the car
            var targetRelation = await _context.Users2Cars
                .FirstOrDefaultAsync(uc => uc.CarId == carId && uc.UserId == targetUserId);

            if (targetRelation == null)
            {
                _logger.LogWarning("Target user {UserId} does not have access to car {CarId}", targetUserId, carId);
                return false;
            }

            // Prevent changing MASTER_OWNER role (can only be changed through ownership transfer)
            if (targetRelation.RoleCode == "MASTER_OWNER")
            {
                _logger.LogWarning("Cannot change MASTER_OWNER role directly");
                return false;
            }

            // Prevent non-MASTER_OWNER from promoting to OWNER
            if (newRole == "OWNER" && requesterRelation.RoleCode != "MASTER_OWNER")
            {
                _logger.LogWarning("Only MASTER_OWNER can promote users to OWNER role");
                return false;
            }

            // Prevent users from changing their own role
            if (requesterId == targetUserId)
            {
                _logger.LogWarning("Users cannot change their own role");
                return false;
            }

            // Update the role
            targetRelation.RoleCode = newRole;
            targetRelation.AssignedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Changed role of user {UserId} to {NewRole} for car {CarId}", targetUserId, newRole, carId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing role for user {UserId} in car {CarId}", targetUserId, carId);
            throw;
        }
    }

    public async Task<bool> AssignViewerRoleAsync(int carId, int requesterId, string viewerEmail)
    {
        try
        {
            // Check if requester has permission
            var requesterRelation = await _context.Users2Cars
                .FirstOrDefaultAsync(uc => uc.CarId == carId && uc.UserId == requesterId);

            if (requesterRelation == null || (requesterRelation.RoleCode != "MASTER_OWNER" && requesterRelation.RoleCode != "OWNER"))
            {
                _logger.LogWarning("User {RequesterId} does not have permission to assign viewers for car {CarId}", requesterId, carId);
                return false;
            }

            // Find viewer by email
            var viewerUser = await GetUserByEmailAsync(viewerEmail);
            if (viewerUser == null)
            {
                _logger.LogWarning("User with email {Email} not found", viewerEmail);
                return false;
            }

            // Check if user already has access to this car
            var existingRelation = await _context.Users2Cars
                .FirstOrDefaultAsync(uc => uc.CarId == carId && uc.UserId == viewerUser.UserId);

            if (existingRelation != null)
            {
                // Update existing relation to VIEWER
                existingRelation.RoleCode = "VIEWER";
                existingRelation.AssignedAt = DateTime.UtcNow;
            }
            else
            {
                // Create new VIEWER relation
                var newViewerRelation = new Users2Car
                {
                    UserId = viewerUser.UserId,
                    CarId = carId,
                    RoleCode = "VIEWER",
                    AssignedAt = DateTime.UtcNow
                };
                _context.Users2Cars.Add(newViewerRelation);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Assigned VIEWER role to user {UserId} for car {CarId}", viewerUser.UserId, carId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning viewer role for car {CarId}", carId);
            throw;
        }
    }

    public async Task<bool> RemoveUserAccessAsync(int carId, int requesterId, int targetUserId)
    {
        try
        {
            // Check if requester has permission
            var requesterRelation = await _context.Users2Cars
                .FirstOrDefaultAsync(uc => uc.CarId == carId && uc.UserId == requesterId);

            if (requesterRelation == null || (requesterRelation.RoleCode != "MASTER_OWNER" && requesterRelation.RoleCode != "OWNER"))
            {
                _logger.LogWarning("User {RequesterId} does not have permission to remove access for car {CarId}", requesterId, carId);
                return false;
            }

            // Find target user's relation
            var targetRelation = await _context.Users2Cars
                .FirstOrDefaultAsync(uc => uc.CarId == carId && uc.UserId == targetUserId);

            if (targetRelation == null)
            {
                _logger.LogWarning("Target user {UserId} does not have access to car {CarId}", targetUserId, carId);
                return false;
            }

            // Prevent removing MASTER_OWNER
            if (targetRelation.RoleCode == "MASTER_OWNER")
            {
                _logger.LogWarning("Cannot remove MASTER_OWNER access");
                return false;
            }

            // Allow users to remove their own access if they're not MASTER_OWNER
            // But prevent OWNER from removing themselves if they're the last OWNER
            if (requesterId == targetUserId && targetRelation.RoleCode == "OWNER")
            {
                // Check if there are other OWNERs or MASTER_OWNERs
                var otherManagers = await _context.Users2Cars
                    .Where(uc => uc.CarId == carId && 
                                uc.UserId != targetUserId && 
                                (uc.RoleCode == "OWNER" || uc.RoleCode == "MASTER_OWNER"))
                    .CountAsync();

                if (otherManagers == 0)
                {
                    _logger.LogWarning("Cannot remove last manager from car {CarId}", carId);
                    return false;
                }
            }

            // Remove the relation
            _context.Users2Cars.Remove(targetRelation);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Removed access for user {UserId} from car {CarId}", targetUserId, carId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing access for user {UserId} from car {CarId}", targetUserId, carId);
            throw;
        }
    }

    public async Task<bool> CanManageRolesAsync(int userId, int carId)
    {
        var relation = await _context.Users2Cars
            .FirstOrDefaultAsync(uc => uc.UserId == userId && uc.CarId == carId);
        
        return relation != null && (relation.RoleCode == "MASTER_OWNER" || relation.RoleCode == "OWNER");
    }
}
