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
                    AssignedAt = u2c.AssignedAt
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
}
