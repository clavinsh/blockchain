using System.Diagnostics;
using System.Text.Json;
using backend.Services.Fabric;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

/// <summary>
/// Test controller for measuring blockchain operation performance
/// </summary>
[ApiController]
[Route("api/blockchain/test")]
public class BlockchainTestController : ControllerBase
{
    private readonly TelemetryService _telemetryService;
    private readonly ILogger<BlockchainTestController> _logger;

    public BlockchainTestController(
        TelemetryService telemetryService,
        ILogger<BlockchainTestController> logger)
    {
        _telemetryService = telemetryService;
        _logger = logger;
    }

    /// <summary>
    /// Test: Submit telemetry to blockchain and measure performance
    /// POST /api/blockchain/test/submit
    /// </summary>
    [HttpPost("submit")]
    public async Task<ActionResult> TestSubmitTelemetry([FromQuery] string? carId = null)
    {

        // Use provided carId or default to test car
        var testCarId = carId ?? "1";

        // Generate sample telemetry data (similar to SQL init data)
        var telemetryData = new
        {
            SensorDataId = Guid.NewGuid().ToString(),
            VehicleId = testCarId,
            Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:sszzz"),
            Latitude = 56.923034 + (Random.Shared.NextDouble() - 0.5) * 0.01,
            Longitude = 24.108351 + (Random.Shared.NextDouble() - 0.5) * 0.01,
            Altitude = 4.7 + Random.Shared.NextDouble() * 2,
            GpsAccuracy = 2.0 + Random.Shared.NextDouble() * 5,
            Heading = Random.Shared.Next(0, 360),
            AccelerationX = (Random.Shared.NextDouble() - 0.5) * 0.1,
            AccelerationY = (Random.Shared.NextDouble() - 0.5) * 0.1,
            AccelerationZ = (Random.Shared.NextDouble() - 0.5) * 0.1,
            SpeedKmh = Random.Shared.Next(0, 120),
            EngineRpm = Random.Shared.Next(700, 4000),
            EngineTemperature = Random.Shared.Next(50, 100),
            FuelLevel = Random.Shared.Next(20, 100),
            OdometerKm = 50000 + Random.Shared.Next(0, 10000),
            ThrottlePosition = Random.Shared.Next(0, 100),
            BrakePedal = Random.Shared.Next(0, 2) == 1
        };

        var carDataJson = JsonSerializer.Serialize(telemetryData);


        var stopwatch = Stopwatch.StartNew();
        try
        {
            var request = new SubmitTelemetryRequest(testCarId, carDataJson);

            var result = await _telemetryService.SubmitTelemetryAsync(request);

            stopwatch.Stop();

            _logger.LogInformation(
                "Blockchain SUBMIT completed in {ElapsedMs}ms for CarId: {CarId}",
                stopwatch.ElapsedMilliseconds,
                testCarId);

            return Ok(new
            {
                operation = "SUBMIT",
                carId = testCarId,
                success = result.Success,
                elapsedMs = stopwatch.ElapsedMilliseconds,
                result = result.Result,
                txId = result.TxId,
                sampleData = telemetryData
            });
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            _logger.LogError(
                ex,
                "Blockchain SUBMIT failed after {ElapsedMs}ms",
                stopwatch.ElapsedMilliseconds);

            return StatusCode(500, new
            {
                operation = "SUBMIT",
                success = false,
                elapsedMs = stopwatch.ElapsedMilliseconds,
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Test: Retrieve telemetry from blockchain and measure performance
    /// GET /api/blockchain/test/get/{carId}
    /// </summary>
    [HttpGet("get/{carId}")]
    public async Task<ActionResult> TestGetTelemetry(string carId)
    {
        var stopwatch = Stopwatch.StartNew();

        try
        {
            var telemetry = await _telemetryService.GetTelemetryByVehicleAsync(carId);

            stopwatch.Stop();

            _logger.LogInformation(
                "Blockchain GET completed in {ElapsedMs}ms for CarId: {CarId}, retrieved {Count} records",
                stopwatch.ElapsedMilliseconds,
                carId,
                telemetry.Count);

            return Ok(new
            {
                operation = "GET",
                carId,
                success = true,
                elapsedMs = stopwatch.ElapsedMilliseconds,
                recordCount = telemetry.Count,
                records = telemetry
            });
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            _logger.LogError(
                ex,
                "Blockchain GET failed after {ElapsedMs}ms for CarId: {CarId}",
                stopwatch.ElapsedMilliseconds,
                carId);

            return StatusCode(500, new
            {
                operation = "GET",
                carId,
                success = false,
                elapsedMs = stopwatch.ElapsedMilliseconds,
                error = ex.Message
            });
        }
    }

    // /// <summary>
    // /// Test: Submit multiple telemetry records and measure average performance
    // /// POST /api/blockchain/test/bulk-submit
    // /// </summary>
    // [HttpPost("bulk-submit")]
    // public async Task<ActionResult> TestBulkSubmit(
    //     [FromQuery] string? carId = null,
    //     [FromQuery] int count = 10)
    // {
    //     if (count < 1 || count > 100)
    //     {
    //         return BadRequest(new { error = "Count must be between 1 and 100" });
    //     }

    //     var testCarId = carId ?? "1";
    //     var results = new List<object>();
    //     var totalStopwatch = Stopwatch.StartNew();
    //     var successCount = 0;
    //     var failureCount = 0;

    //     for (int i = 0; i < count; i++)
    //     {
    //         var itemStopwatch = Stopwatch.StartNew();

    //         try
    //         {
    //             var telemetryData = new
    //             {
    //                 SensorDataId = Guid.NewGuid().ToString(),
    //                 VehicleId = testCarId,
    //                 Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:sszzz"),
    //                 Latitude = 56.923034 + (Random.Shared.NextDouble() - 0.5) * 0.01,
    //                 Longitude = 24.108351 + (Random.Shared.NextDouble() - 0.5) * 0.01,
    //                 Altitude = 4.7 + Random.Shared.NextDouble() * 2,
    //                 GpsAccuracy = 2.0 + Random.Shared.NextDouble() * 5,
    //                 Heading = Random.Shared.Next(0, 360),
    //                 AccelerationX = (Random.Shared.NextDouble() - 0.5) * 0.1,
    //                 AccelerationY = (Random.Shared.NextDouble() - 0.5) * 0.1,
    //                 AccelerationZ = (Random.Shared.NextDouble() - 0.5) * 0.1,
    //                 SpeedKmh = Random.Shared.Next(0, 120),
    //                 EngineRpm = Random.Shared.Next(700, 4000),
    //                 EngineTemperature = Random.Shared.Next(50, 100),
    //                 FuelLevel = Random.Shared.Next(20, 100),
    //                 OdometerKm = 50000 + Random.Shared.Next(0, 10000),
    //                 ThrottlePosition = Random.Shared.Next(0, 100),
    //                 BrakePedal = Random.Shared.Next(0, 2) == 1
    //             };

    //             var carDataJson = JsonSerializer.Serialize(telemetryData);
    //             var request = new SubmitTelemetryRequest(testCarId, carDataJson);
    //             var result = await _telemetryService.SubmitTelemetryAsync(request);

    //             itemStopwatch.Stop();
    //             successCount++;

    //             results.Add(new
    //             {
    //                 index = i + 1,
    //                 success = true,
    //                 elapsedMs = itemStopwatch.ElapsedMilliseconds
    //             });
    //         }
    //         catch (Exception ex)
    //         {
    //             itemStopwatch.Stop();
    //             failureCount++;

    //             results.Add(new
    //             {
    //                 index = i + 1,
    //                 success = false,
    //                 elapsedMs = itemStopwatch.ElapsedMilliseconds,
    //                 error = ex.Message
    //             });
    //         }
    //     }

    //     totalStopwatch.Stop();

    //     var successResults = results
    //         .Where(r => ((dynamic)r).success)
    //         .Select(r => ((dynamic)r).elapsedMs)
    //         .ToList();

    //     return Ok(new
    //     {
    //         operation = "BULK_SUBMIT",
    //         carId = testCarId,
    //         totalCount = count,
    //         successCount,
    //         failureCount,
    //         totalElapsedMs = totalStopwatch.ElapsedMilliseconds,
    //         averageElapsedMs = successResults.Any() ? successResults.Average() : 0,
    //         minElapsedMs = successResults.Any() ? successResults.Min() : 0,
    //         maxElapsedMs = successResults.Any() ? successResults.Max() : 0,
    //         results
    //     });
    // }

    /// <summary>
    /// Test: Get all telemetry and measure performance
    /// GET /api/blockchain/test/get-all
    /// </summary>
    [HttpGet("get-all")]
    public async Task<ActionResult> TestGetAllTelemetry()
    {
        var stopwatch = Stopwatch.StartNew();

        try
        {
            var telemetry = await _telemetryService.GetAllTelemetryAsync();

            stopwatch.Stop();

            _logger.LogInformation(
                "Blockchain GET_ALL completed in {ElapsedMs}ms, retrieved {Count} records",
                stopwatch.ElapsedMilliseconds,
                telemetry.Count);

            return Ok(new
            {
                operation = "GET_ALL",
                success = true,
                elapsedMs = stopwatch.ElapsedMilliseconds,
                recordCount = telemetry.Count,
                records = telemetry
            });
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            _logger.LogError(
                ex,
                "Blockchain GET_ALL failed after {ElapsedMs}ms",
                stopwatch.ElapsedMilliseconds);

            return StatusCode(500, new
            {
                operation = "GET_ALL",
                success = false,
                elapsedMs = stopwatch.ElapsedMilliseconds,
                error = ex.Message
            });
        }
    }
}
