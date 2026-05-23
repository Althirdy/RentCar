using System.ComponentModel.DataAnnotations;
namespace RentCar.DTOs.Bookings
{
    public sealed record CreateBookingRequest(
        [Range(1, int.MaxValue)] int CarId,
        [Range(1, int.MaxValue)] int UserId,
        DateTime StartDate,
        DateTime EndDate);
}
