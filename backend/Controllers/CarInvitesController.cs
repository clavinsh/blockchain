using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CarInvitesController : ControllerBase
{
    private readonly BlockchainDbContext _context;
    private readonly ILogger<CarInvitesController> _logger;

    public CarInvitesController(BlockchainDbContext context, ILogger<CarInvitesController> logger)
    {
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

    [HttpPost]
    public async Task<ActionResult<InviteActionResponse>> CreateInvite([FromBody] CreateInviteRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new InviteActionResponse
            {
                Success = false,
                Message = "Invalid authentication token"
            });
        }

        // Verify the car exists
        var car = await _context.CarTables.FindAsync(request.CarId);
        if (car == null)
        {
            return NotFound(new InviteActionResponse
            {
                Success = false,
                Message = "Car not found"
            });
        }

        // Verify the inviter has ownership/permission for this car
        var userCarRelation = await _context.Users2Cars
            .FirstOrDefaultAsync(uc => uc.UserId == userId && uc.CarId == request.CarId);

        if (userCarRelation == null)
        {
            return Forbid();
        }

// Only OWNER role can send invites
    if (userCarRelation.RoleCode != "OWNER")
        {
            return StatusCode(403, new InviteActionResponse
            {
                Success = false,
                Message = "Tikai īpašnieki var sūtīt uzaicinājumus"
            });
        }

        // Find the invited user by email
        var invitedUser = await _context.UserTables
            .FirstOrDefaultAsync(u => u.Email == request.InvitedUserEmail);

        if (invitedUser == null)
        {
            return NotFound(new InviteActionResponse
            {
                Success = false,
                Message = "User with this email not found"
            });
        }

        // Check if user is trying to invite themselves
        if (invitedUser.UserId == userId)
        {
            return BadRequest(new InviteActionResponse
            {
                Success = false,
                Message = "Cannot invite yourself"
            });
        }

        // Check if the invited user already has access to this car
        var existingAccess = await _context.Users2Cars
            .FirstOrDefaultAsync(uc => uc.UserId == invitedUser.UserId && uc.CarId == request.CarId);

        if (existingAccess != null)
        {
            return BadRequest(new InviteActionResponse
            {
                Success = false,
                Message = "User already has access to this car"
            });
        }

        // Check for existing pending invite
        var existingInvite = await _context.CarInvites
            .FirstOrDefaultAsync(ci => ci.CarId == request.CarId
                && ci.InvitedUserId == invitedUser.UserId
                && ci.InviteStatus == "PENDING");

        if (existingInvite != null)
        {
            return BadRequest(new InviteActionResponse
            {
                Success = false,
                Message = "A pending invite already exists for this user and car"
            });
        }

        // Validate role code (can invite as DRIVER or VIEWER, OWNER requires ownership transfer)
        if (request.RoleCode != "OWNER" && request.RoleCode != "DRIVER" && request.RoleCode != "VIEWER")
        {
            return BadRequest(new InviteActionResponse
            {
                Success = false,
                Message = "Nepareiza lomas kods. Jābūt OWNER, DRIVER vai VIEWER"
            });
        }

        // Create the invite
        var invite = new CarInvite
        {
            CarId = request.CarId,
            InviterUserId = userId.Value,
            InvitedUserId = invitedUser.UserId,
            RoleCode = request.RoleCode,
            InviteStatus = "PENDING",
            CreatedAt = DateTime.UtcNow
        };

        _context.CarInvites.Add(invite);
        await _context.SaveChangesAsync();

        // Load navigation properties for response
        await _context.Entry(invite).Reference(i => i.Car).LoadAsync();
        await _context.Entry(invite).Reference(i => i.Inviter).LoadAsync();
        await _context.Entry(invite).Reference(i => i.InvitedUser).LoadAsync();

        return Ok(new InviteActionResponse
        {
            Success = true,
            Message = "Invite sent successfully",
            Invite = MapToInviteResponse(invite)
        });
    }

    [HttpGet("received")]
    public async Task<ActionResult<List<InviteResponse>>> GetReceivedInvites()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized();
        }

        var invites = await _context.CarInvites
            .Include(i => i.Car)
            .Include(i => i.Inviter)
            .Include(i => i.InvitedUser)
            .Where(i => i.InvitedUserId == userId && i.InviteStatus == "PENDING")
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        return Ok(invites.Select(MapToInviteResponse).ToList());
    }

    [HttpGet("sent")]
    public async Task<ActionResult<List<InviteResponse>>> GetSentInvites()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized();
        }

        var invites = await _context.CarInvites
            .Include(i => i.Car)
            .Include(i => i.Inviter)
            .Include(i => i.InvitedUser)
            .Where(i => i.InviterUserId == userId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        return Ok(invites.Select(MapToInviteResponse).ToList());
    }

    [HttpPost("{id}/accept")]
    public async Task<ActionResult<InviteActionResponse>> AcceptInvite(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(new InviteActionResponse
                {
                    Success = false,
                    Message = "Invalid authentication token"
                });
            }

            var invite = await _context.CarInvites
                .Include(i => i.Car)
                .Include(i => i.Inviter)
                .Include(i => i.InvitedUser)
                .FirstOrDefaultAsync(i => i.InviteId == id);

            if (invite == null)
            {
                return NotFound(new InviteActionResponse
                {
                    Success = false,
                    Message = "Invite not found"
                });
            }

            // Verify the current user is the invited user
            if (invite.InvitedUserId != userId)
            {
                return Forbid();
            }

            // Verify the invite is still pending
            if (invite.InviteStatus != "PENDING")
            {
                return BadRequest(new InviteActionResponse
                {
                    Success = false,
                    Message = $"Invite is already {invite.InviteStatus.ToLower()}"
                });
            }

            // Delete any previous accepted/declined invites for this user-car combination to avoid unique constraint violation
            var oldInvites = await _context.CarInvites
                .Where(ci => ci.CarId == invite.CarId
                    && ci.InvitedUserId == invite.InvitedUserId
                    && ci.InviteId != id
                    && (ci.InviteStatus == "ACCEPTED" || ci.InviteStatus == "DECLINED"))
                .ToListAsync();

            if (oldInvites.Any())
            {
                _context.CarInvites.RemoveRange(oldInvites);
                _logger.LogInformation("Removed {Count} old invites for user {UserId} and car {CarId}",
                    oldInvites.Count, invite.InvitedUserId, invite.CarId);
            }

            // Add user access for any role (OWNER or VIEWER)
            // Check if user already has access to this car
            var existingAccess = await _context.Users2Cars
                .FirstOrDefaultAsync(uc => uc.UserId == invite.InvitedUserId && uc.CarId == invite.CarId);

            if (existingAccess != null)
            {
                // Update existing role
                existingAccess.RoleCode = invite.RoleCode;
                existingAccess.AssignedAt = DateTime.UtcNow;
                _logger.LogInformation("Updated existing access for user {UserId} on car {CarId} to role {Role}",
                    invite.InvitedUserId, invite.CarId, invite.RoleCode);
            }
            else
            {
                // Create new access
                var userCarRelation = new Users2Car
                {
                    UserId = invite.InvitedUserId,
                    CarId = invite.CarId,
                    RoleCode = invite.RoleCode,
                    AssignedAt = DateTime.UtcNow
                };

                _context.Users2Cars.Add(userCarRelation);
                _logger.LogInformation("Added new access for user {UserId} on car {CarId} with role {Role}",
                    invite.InvitedUserId, invite.CarId, invite.RoleCode);
            }

            // Update invite status
            invite.InviteStatus = "ACCEPTED";
            invite.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new InviteActionResponse
            {
                Success = true,
                Message = "Uzaicinājums pieņemts veiksmīgi",
                Invite = MapToInviteResponse(invite)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error accepting invite {InviteId}", id);
            return StatusCode(500, new InviteActionResponse
            {
                Success = false,
                Message = "Kļūda pieņemot uzaicinājumu"
            });
        }
    }

    [HttpPost("{id}/decline")]
    public async Task<ActionResult<InviteActionResponse>> DeclineInvite(int id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new InviteActionResponse
            {
                Success = false,
                Message = "Invalid authentication token"
            });
        }

        var invite = await _context.CarInvites
            .Include(i => i.Car)
            .Include(i => i.Inviter)
            .Include(i => i.InvitedUser)
            .FirstOrDefaultAsync(i => i.InviteId == id);

        if (invite == null)
        {
            return NotFound(new InviteActionResponse
            {
                Success = false,
                Message = "Invite not found"
            });
        }

        // Verify the current user is the invited user
        if (invite.InvitedUserId != userId)
        {
            return Forbid();
        }

        // Verify the invite is still pending
        if (invite.InviteStatus != "PENDING")
        {
            return BadRequest(new InviteActionResponse
            {
                Success = false,
                Message = $"Invite is already {invite.InviteStatus.ToLower()}"
            });
        }

        // Update invite status
        invite.InviteStatus = "DECLINED";
        invite.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new InviteActionResponse
        {
            Success = true,
            Message = "Invite declined",
            Invite = MapToInviteResponse(invite)
        });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<InviteActionResponse>> CancelInvite(int id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new InviteActionResponse
            {
                Success = false,
                Message = "Invalid authentication token"
            });
        }

        var invite = await _context.CarInvites
            .Include(i => i.Car)
            .Include(i => i.Inviter)
            .Include(i => i.InvitedUser)
            .FirstOrDefaultAsync(i => i.InviteId == id);

        if (invite == null)
        {
            return NotFound(new InviteActionResponse
            {
                Success = false,
                Message = "Invite not found"
            });
        }

        // Verify the current user is the inviter
        if (invite.InviterUserId != userId)
        {
            return Forbid();
        }

        // Can only cancel pending invites
        if (invite.InviteStatus != "PENDING")
        {
            return BadRequest(new InviteActionResponse
            {
                Success = false,
                Message = $"Cannot cancel invite that is already {invite.InviteStatus.ToLower()}"
            });
        }

        // Update invite status
        invite.InviteStatus = "CANCELLED";
        invite.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new InviteActionResponse
        {
            Success = true,
            Message = "Invite cancelled",
            Invite = MapToInviteResponse(invite)
        });
    }

    private InviteResponse MapToInviteResponse(CarInvite invite)
    {
        return new InviteResponse
        {
            InviteId = invite.InviteId,
            CarId = invite.CarId,
            CarBrand = invite.Car.Brand,
            CarModel = invite.Car.Model,
            CarYear = invite.Car.Year,
            InviterUsername = invite.Inviter.Username,
            InviterEmail = invite.Inviter.Email,
            InvitedUsername = invite.InvitedUser.Username,
            InvitedEmail = invite.InvitedUser.Email,
            RoleCode = invite.RoleCode,
            InviteStatus = invite.InviteStatus,
            CreatedAt = invite.CreatedAt
        };
    }
}
