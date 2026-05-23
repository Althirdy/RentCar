using System.Data;
using Microsoft.EntityFrameworkCore;
using RentCar.Data;
using RentCar.DTOs.Bookings;
using RentCar.Models;
using RentCar.Models.Enums;

namespace RentCar.Services.Bookings
{
    public sealed class BookingService(AppDbContext context) : IBookingService
    {
        public async Task<IReadOnlyList<BookingDto>> GetAllAsync(CancellationToken cancellationToken)
        {
            return await context.Bookings
                .AsNoTracking()
                .OrderByDescending(booking => booking.CreatedAt)
                .Select(booking => ToDto(booking))
                .ToListAsync(cancellationToken);
        }

        public async Task<BookingDto?> GetByIdAsync(int id, CancellationToken cancellationToken)
        {
            return await context.Bookings
                .AsNoTracking()
                .Where(booking => booking.Id == id)
                .Select(booking => ToDto(booking))
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<ServiceResult<BookingDto>> CreateAsync(CreateBookingRequest request, CancellationToken cancellationToken)
        {
            var validation = ValidateDates(request.StartDate, request.EndDate);
            if (validation is not null)
            {
                return ServiceResult<BookingDto>.Validation(validation);
            }

            await using var transaction = await context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            var car = await context.Cars.FindAsync(new object[] { request.CarId }, cancellationToken);
            if (car is null)
            {
                return ServiceResult<BookingDto>.NotFound($"Car with id {request.CarId} was not found.");
            }

            if (car.Status != CarStatus.Active)
            {
                return ServiceResult<BookingDto>.Validation("Only active cars can be booked.");
            }

            var userExists = await context.Users.AnyAsync(user => user.Id == request.UserId, cancellationToken);
            if (!userExists)
            {
                return ServiceResult<BookingDto>.NotFound($"User with id {request.UserId} was not found.");
            }

            if (await HasOverlappingBookingAsync(request.CarId, request.StartDate, request.EndDate, excludedBookingId: null, cancellationToken))
            {
                return ServiceResult<BookingDto>.Conflict("This car already has a booking for the selected dates.");
            }

            var booking = new Booking
            {
                CarId = request.CarId,
                UserId = request.UserId,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                TotalPrice = CalculateTotalPrice(car.PricePerDay, request.StartDate, request.EndDate),
                Status = BookingStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            context.Bookings.Add(booking);
            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return ServiceResult<BookingDto>.Success(ToDto(booking));
        }

        public async Task<ServiceResult> UpdateAsync(int id, UpdateBookingRequest request, CancellationToken cancellationToken)
        {
            if (!Enum.IsDefined(request.Status))
            {
                return ServiceResult.Validation("Invalid booking status.");
            }

            var validation = ValidateDates(
                request.StartDate,
                request.EndDate,
                allowPastStart: request.Status == BookingStatus.Cancelled);
            if (validation is not null)
            {
                return ServiceResult.Validation(validation);
            }

            await using var transaction = await context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            var booking = await context.Bookings.FindAsync(new object[] { id }, cancellationToken);
            if (booking is null)
            {
                return ServiceResult.NotFound($"Booking with id {id} was not found.");
            }

            var car = await context.Cars.FindAsync(new object[] { request.CarId }, cancellationToken);
            if (car is null)
            {
                return ServiceResult.NotFound($"Car with id {request.CarId} was not found.");
            }

            if (car.Status != CarStatus.Active && request.Status != BookingStatus.Cancelled)
            {
                return ServiceResult.Validation("Only active cars can have active bookings.");
            }

            var userExists = await context.Users.AnyAsync(user => user.Id == request.UserId, cancellationToken);
            if (!userExists)
            {
                return ServiceResult.NotFound($"User with id {request.UserId} was not found.");
            }

            if (request.Status != BookingStatus.Cancelled &&
                await HasOverlappingBookingAsync(request.CarId, request.StartDate, request.EndDate, id, cancellationToken))
            {
                return ServiceResult.Conflict("This car already has a booking for the selected dates.");
            }

            booking.CarId = request.CarId;
            booking.UserId = request.UserId;
            booking.StartDate = request.StartDate;
            booking.EndDate = request.EndDate;
            booking.TotalPrice = CalculateTotalPrice(car.PricePerDay, request.StartDate, request.EndDate);
            booking.Status = request.Status;

            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return ServiceResult.Success();
        }

        public async Task<ServiceResult> DeleteAsync(int id, CancellationToken cancellationToken)
        {
            var booking = await context.Bookings.FindAsync(new object[] { id }, cancellationToken);
            if (booking is null)
            {
                return ServiceResult.NotFound($"Booking with id {id} was not found.");
            }

            context.Bookings.Remove(booking);
            await context.SaveChangesAsync(cancellationToken);

            return ServiceResult.Success();
        }

        private async Task<bool> HasOverlappingBookingAsync(
            int carId,
            DateTime startDate,
            DateTime endDate,
            int? excludedBookingId,
            CancellationToken cancellationToken)
        {
            return await context.Bookings.AnyAsync(
                booking =>
                    booking.CarId == carId &&
                    booking.Status != BookingStatus.Cancelled &&
                    (!excludedBookingId.HasValue || booking.Id != excludedBookingId.Value) &&
                    startDate < booking.EndDate &&
                    endDate > booking.StartDate,
                cancellationToken);
        }

        private static string? ValidateDates(DateTime startDate, DateTime endDate, bool allowPastStart = false)
        {
            if (startDate == default || endDate == default)
            {
                return "Start date and end date are required.";
            }

            if (!allowPastStart && startDate.Date < DateTime.UtcNow.Date)
            {
                return "Start date cannot be in the past.";
            }

            return startDate < endDate ? null : "End date must be after start date.";
        }

        private static decimal CalculateTotalPrice(decimal pricePerDay, DateTime startDate, DateTime endDate)
        {
            var rentalDays = Math.Max(1, (int)Math.Ceiling((endDate - startDate).TotalDays));
            return pricePerDay * rentalDays;
        }

        private static BookingDto ToDto(Booking booking)
        {
            return new BookingDto(
                booking.Id,
                booking.CarId,
                booking.UserId,
                booking.StartDate,
                booking.EndDate,
                booking.TotalPrice,
                booking.Status,
                booking.CreatedAt);
        }
    }
}
