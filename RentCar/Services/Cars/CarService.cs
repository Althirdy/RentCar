using Microsoft.EntityFrameworkCore;
using RentCar.Data;
using RentCar.DTOs.Cars;
using RentCar.Models;
using RentCar.Models.Enums;

namespace RentCar.Services.Cars
{
    public sealed class CarService(AppDbContext context) : ICarService
    {
        public async Task<IReadOnlyList<CarDto>> GetAllAsync(CancellationToken cancellationToken)
        {
            return await context.Cars
                .AsNoTracking()
                .OrderBy(car => car.Maker)
                .ThenBy(car => car.Model)
                .Select(car => ToDto(car))
                .ToListAsync(cancellationToken);
        }

        public async Task<CarDto?> GetByIdAsync(int id, CancellationToken cancellationToken)
        {
            return await context.Cars
                .AsNoTracking()
                .Where(car => car.Id == id)
                .Select(car => ToDto(car))
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<ServiceResult<CarDto>> CreateAsync(CreateCarRequest request, CancellationToken cancellationToken)
        {
            var validation = ValidateCarEnums(request.Status, request.FuelType, request.TransmissionType);
            if (validation is not null)
            {
                return ServiceResult<CarDto>.Validation(validation);
            }

            var car = new Car
            {
                Maker = request.Maker.Trim(),
                Model = request.Model.Trim(),
                Year = request.Year,
                ImageUrl = NormalizeOptional(request.ImageUrl),
                PricePerDay = request.PricePerDay,
                Status = request.Status,
                FuelType = request.FuelType,
                TransmissionType = request.TransmissionType,
                Seats = request.Seats
            };

            context.Cars.Add(car);
            await context.SaveChangesAsync(cancellationToken);

            return ServiceResult<CarDto>.Success(ToDto(car));
        }

        public async Task<ServiceResult> UpdateAsync(int id, UpdateCarRequest request, CancellationToken cancellationToken)
        {
            var validation = ValidateCarEnums(request.Status, request.FuelType, request.TransmissionType);
            if (validation is not null)
            {
                return ServiceResult.Validation(validation);
            }

            var car = await context.Cars.FindAsync(new object[] { id }, cancellationToken);
            if (car is null)
            {
                return ServiceResult.NotFound($"Car with id {id} was not found.");
            }

            car.Maker = request.Maker.Trim();
            car.Model = request.Model.Trim();
            car.Year = request.Year;
            car.ImageUrl = NormalizeOptional(request.ImageUrl);
            car.PricePerDay = request.PricePerDay;
            car.Status = request.Status;
            car.FuelType = request.FuelType;
            car.TransmissionType = request.TransmissionType;
            car.Seats = request.Seats;

            await context.SaveChangesAsync(cancellationToken);
            return ServiceResult.Success();
        }

        public async Task<ServiceResult> DeleteAsync(int id, CancellationToken cancellationToken)
        {
            var car = await context.Cars.FindAsync(new object[] { id }, cancellationToken);
            if (car is null)
            {
                return ServiceResult.NotFound($"Car with id {id} was not found.");
            }

            var hasBookings = await context.Bookings.AnyAsync(booking => booking.CarId == id, cancellationToken);
            if (hasBookings)
            {
                return ServiceResult.Conflict("Cars with bookings cannot be deleted.");
            }

            try
            {
                context.Cars.Remove(car);
                await context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                return ServiceResult.Conflict("Cars with bookings cannot be deleted.");
            }

            return ServiceResult.Success();
        }

        private static string NormalizeOptional(string? value)
        {
            return value?.Trim() ?? string.Empty;
        }

        private static string? ValidateCarEnums(
            CarStatus status,
            FuelType fuelType,
            TransmissionType transmissionType)
        {
            if (!Enum.IsDefined(status))
            {
                return "Invalid car status.";
            }

            if (!Enum.IsDefined(fuelType))
            {
                return "Invalid fuel type.";
            }

            return Enum.IsDefined(transmissionType) ? null : "Invalid transmission type.";
        }

        private static CarDto ToDto(Car car)
        {
            return new CarDto(
                car.Id,
                car.Maker,
                car.Model,
                car.Year,
                car.ImageUrl,
                car.PricePerDay,
                car.Status,
                car.FuelType,
                car.TransmissionType,
                car.Seats);
        }
    }
}
