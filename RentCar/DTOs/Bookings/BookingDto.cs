using RentCar.Models.Enums;

namespace RentCar.DTOs.Bookings
{
    public sealed record BookingDto(
        int Id,
        int CarId,
        int UserId,
        BookingRenterDto Renter,
        BookingCarDto Car,
        DateTime StartDate,
        DateTime EndDate,
        decimal TotalPrice,
        BookingStatus Status,
        DateTime CreatedAt);

    public sealed record BookingRenterDto(
        int Id,
        string FirstName,
        string MiddleName,
        string LastName,
        string Email,
        string ContactNumber);

    public sealed record BookingCarDto(
        int Id,
        string Maker,
        string Model,
        int Year,
        string ImageUrl,
        decimal PricePerDay);
}
