using RentCar.Models.Enums;

namespace RentCar.DTOs.Users
{
    public sealed record UserDto(
        int Id,
        string Email,
        string ContactNumber,
        string FirstName,
        string MiddleName,
        string LastName,
        RoleType Role,
        DateTime CreatedAt);
}
