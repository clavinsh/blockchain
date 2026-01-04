using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.DTOs;
using backend.Models;
using backend.Services;
using BCrypt.Net;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly BlockchainDbContext _context;
    private readonly TokenService _tokenService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        BlockchainDbContext context,
        TokenService tokenService,
        ILogger<AuthController> logger)
    {
        _context = context;
        _tokenService = tokenService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            // Find user by email
            var user = await _context.UserTables
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive == true);

            if (user == null)
            {
                return Ok(new LoginResponse
                {
                    Success = false,
                    Message = "Invalid login credentials"
                });
            }

            // Verify password
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Ok(new LoginResponse
                {
                    Success = false,
                    Message = "Invalid login credentials"
                });
            }

            // Generate JWT token
            var token = _tokenService.GenerateToken(user);

            return Ok(new LoginResponse
            {
                Success = true,
                Message = "Login successful",
                Token = token,
                User = new UserInfo
                {
                    UserId = user.UserId,
                    Username = user.Username,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(500, new LoginResponse
            {
                Success = false,
                Message = "Server error"
            });
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult<LoginResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            // Check if email already exists
            if (await _context.UserTables.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(new LoginResponse
                {
                    Success = false,
                    Message = "Email is already registered"
                });
            }

            // Check if username already exists
            if (await _context.UserTables.AnyAsync(u => u.Username == request.Username))
            {
                return BadRequest(new LoginResponse
                {
                    Success = false,
                    Message = "Username is already taken"
                });
            }

            // Hash password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // Create new user
            var user = new UserTable
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = passwordHash,
                FirstName = request.FirstName,
                LastName = request.LastName,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.UserTables.Add(user);
            await _context.SaveChangesAsync();

            // Generate JWT token
            var token = _tokenService.GenerateToken(user);

            return Ok(new LoginResponse
            {
                Success = true,
                Message = "Registration successful",
                Token = token,
                User = new UserInfo
                {
                    UserId = user.UserId,
                    Username = user.Username,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration");
            return StatusCode(500, new LoginResponse
            {
                Success = false,
                Message = "Server error"
            });
        }
    }
}
