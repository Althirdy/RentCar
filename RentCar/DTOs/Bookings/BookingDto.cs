using RentCar.Models.Enums;

namespace RentCar.DTOs.Bookings
{
    public sealed record BookingDto(
        int Id,
        int CarId,
        int UserId,
        DateTime StartDate,
        DateTime EndDate,
        decimal TotalPrice,
        BookingStatus Status,
        DateTime CreatedAt);
}
