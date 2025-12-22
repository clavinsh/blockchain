namespace backend.DTOs;

public class ChangeUserRoleRequest
{
    public int CarId { get; set; }
    public int UserId { get; set; }
    public string NewRole { get; set; } = string.Empty; // OWNER, VIEWER
}

public class ChangeUserRoleResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class AssignViewerRequest
{
    public int CarId { get; set; }
    public string ViewerEmail { get; set; } = string.Empty;
}

public class AssignViewerResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}