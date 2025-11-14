using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public class LoginRequest
{
    [Required(ErrorMessage = "E-pasts ir obligāts")]
    [EmailAddress(ErrorMessage = "Nepareizs e-pasta formāts")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Parole ir obligāta")]
    [MinLength(6, ErrorMessage = "Parolei jābūt vismaz 6 simboli garā")]
    public string Password { get; set; } = string.Empty;
}
