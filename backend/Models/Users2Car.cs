using System;
using System.Collections.Generic;

namespace backend.Models;

public partial class Users2Car
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int CarId { get; set; }

    public string RoleCode { get; set; } = null!;

    public DateTime? AssignedAt { get; set; }

    public virtual CarTable Car { get; set; } = null!;

    public virtual UserTable User { get; set; } = null!;
}
