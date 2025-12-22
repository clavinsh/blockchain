namespace backend.DTOs;

public class CreateInviteRequest
{
    public int CarId { get; set; }
    public string InvitedUserEmail { get; set; } = null!;
    public string RoleCode { get; set; } = "VIEWER"; // OWNER or VIEWER only
}

public class InviteResponse
{
    public int InviteId { get; set; }
    public int CarId { get; set; }
    public string CarBrand { get; set; } = null!;
    public string CarModel { get; set; } = null!;
    public int CarYear { get; set; }
    public string InviterUsername { get; set; } = null!;
    public string InviterEmail { get; set; } = null!;
    public string InvitedUsername { get; set; } = null!;
    public string InvitedEmail { get; set; } = null!;
    public string RoleCode { get; set; } = null!;
    public string InviteStatus { get; set; } = null!;
    public DateTime? CreatedAt { get; set; }
}

public class InviteActionResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = null!;
    public InviteResponse? Invite { get; set; }
}
