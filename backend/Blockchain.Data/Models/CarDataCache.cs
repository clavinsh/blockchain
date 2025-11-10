using System;
using System.Collections.Generic;

namespace Blockchain.Data.Models;

public partial class CarDataCache
{
    public int Id { get; set; }

    public int CarId { get; set; }

    public string CarData { get; set; } = null!;

    public DateTime? InsertTime { get; set; }

    public DateTime? DeleteTime { get; set; }

    public virtual CarTable Car { get; set; } = null!;
}
