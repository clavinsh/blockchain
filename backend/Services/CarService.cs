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
}
