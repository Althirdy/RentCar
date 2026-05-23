using System.ComponentModel.DataAnnotations;
using RentCar.Models.Enums;

namespace RentCar.DTOs.Bookings
{
    public sealed record UpdateBookingRequest(
        [Range(1, int.MaxValue)] int CarId,
        [Range(1, int.MaxValue)] int UserId,
        DateTime StartDate,
        DateTime EndDate,
        BookingStatus Status);
}
