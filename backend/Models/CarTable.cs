using System;
using System.Collections.Generic;

namespace backend.Models;

public partial class CarTable
{
    public int CarId { get; set; }

    public string Brand { get; set; } = null!;

    public string Model { get; set; } = null!;

    public int Year { get; set; }

    public string? LicensePlate { get; set; }

    public string? Vin { get; set; }

    public string? Color { get; set; }

    public int? Mileage { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<CarDataCache> CarDataCaches { get; set; } = new List<CarDataCache>();

    public virtual ICollection<Users2Car> Users2Cars { get; set; } = new List<Users2Car>();
}
