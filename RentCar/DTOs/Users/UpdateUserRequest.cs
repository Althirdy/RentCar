using System.ComponentModel.DataAnnotations;
namespace RentCar.DTOs.Users
{
    public sealed record UpdateUserRequest(
        [Required, MaxLength(100), EmailAddress] string Email,
        [MaxLength(15)] string ContactNumber,
        [Required, MaxLength(50)] string FirstName,
        [MaxLength(50)] string MiddleName,
        [Required, MaxLength(50)] string LastName,
        [MinLength(6), MaxLength(100)] string? Password);
}
