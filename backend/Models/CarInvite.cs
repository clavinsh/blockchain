using System;
using System.Collections.Generic;

namespace backend.Models;

public partial class CarInvite
{
    public int InviteId { get; set; }

    public int CarId { get; set; }

    public int InviterUserId { get; set; }

    public int InvitedUserId { get; set; }

    public string RoleCode { get; set; } = null!;

    public string InviteStatus { get; set; } = "PENDING";

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual CarTable Car { get; set; } = null!;

    public virtual UserTable Inviter { get; set; } = null!;

    public virtual UserTable InvitedUser { get; set; } = null!;
}
