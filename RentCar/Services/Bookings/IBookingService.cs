using RentCar.DTOs.Bookings;

namespace RentCar.Services.Bookings
{
    public interface IBookingService
    {
        Task<IReadOnlyList<BookingDto>> GetAllAsync(CancellationToken cancellationToken);
        Task<BookingDto?> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<ServiceResult<BookingDto>> CreateAsync(CreateBookingRequest request, CancellationToken cancellationToken);
        Task<ServiceResult> UpdateAsync(int id, UpdateBookingRequest request, CancellationToken cancellationToken);
        Task<ServiceResult> DeleteAsync(int id, CancellationToken cancellationToken);
    }
}
