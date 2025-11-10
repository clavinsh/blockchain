using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public class RegisterRequest
{
    [Required(ErrorMessage = "Lietotājvārds ir obligāts")]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "E-pasts ir obligāts")]
    [EmailAddress(ErrorMessage = "Nepareizs e-pasta formāts")]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Parole ir obligāta")]
    [MinLength(6, ErrorMessage = "Parolei jābūt vismaz 6 simboli garā")]
    public string Password { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? FirstName { get; set; }

    [MaxLength(50)]
    public string? LastName { get; set; }
}
