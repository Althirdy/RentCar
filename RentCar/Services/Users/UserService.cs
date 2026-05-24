using Microsoft.EntityFrameworkCore;
using RentCar.Data;
using RentCar.DTOs.Users;
using RentCar.Models;
using RentCar.Models.Enums;

namespace RentCar.Services.Users
{
    public sealed class UserService(AppDbContext context) : IUserService
    {
        public async Task<IReadOnlyList<UserDto>> GetAllAsync(CancellationToken cancellationToken)
        {
            return await context.Users
                .AsNoTracking()
                .OrderBy(user => user.LastName)
                .ThenBy(user => user.FirstName)
                .Select(user => new UserDto(
                    user.Id,
                    user.Email,
                    user.ContactNumber,
                    user.FirstName,
                    user.MiddleName,
                    user.LastName,
                    user.Role,
                    user.CreatedAt,
                    user.Bookings.Count(),
                    user.Bookings.Count(booking =>
                        booking.Status == BookingStatus.Pending ||
                        booking.Status == BookingStatus.Confirmed),
                    user.Bookings.Count(booking => booking.Status == BookingStatus.Pending),
                    user.Bookings.Count(booking => booking.Status == BookingStatus.Confirmed)))
                .ToListAsync(cancellationToken);
        }

        public async Task<UserDto?> GetByIdAsync(int id, CancellationToken cancellationToken)
        {
            return await context.Users
                .AsNoTracking()
                .Where(user => user.Id == id)
                .Select(user => new UserDto(
                    user.Id,
                    user.Email,
                    user.ContactNumber,
                    user.FirstName,
                    user.MiddleName,
                    user.LastName,
                    user.Role,
                    user.CreatedAt,
                    user.Bookings.Count(),
                    user.Bookings.Count(booking =>
                        booking.Status == BookingStatus.Pending ||
                        booking.Status == BookingStatus.Confirmed),
                    user.Bookings.Count(booking => booking.Status == BookingStatus.Pending),
                    user.Bookings.Count(booking => booking.Status == BookingStatus.Confirmed)))
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<ServiceResult<UserDto>> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken)
        {
            var email = NormalizeEmail(request.Email);
            if (await EmailExistsAsync(email, excludedUserId: null, cancellationToken))
            {
                return ServiceResult<UserDto>.Conflict("A user with this email already exists.");
            }

            var user = new User
            {
                Email = email,
                ContactNumber = NormalizeOptional(request.ContactNumber),
                FirstName = request.FirstName.Trim(),
                MiddleName = NormalizeOptional(request.MiddleName),
                LastName = request.LastName.Trim(),
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = RoleType.Renter,
                CreatedAt = DateTime.UtcNow
            };

            try
            {
                context.Users.Add(user);
                await context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                return ServiceResult<UserDto>.Conflict("A user with this email already exists.");
            }

            return ServiceResult<UserDto>.Success(ToDto(user));
        }

        public async Task<ServiceResult> UpdateAsync(int id, UpdateUserRequest request, CancellationToken cancellationToken)
        {
            var user = await context.Users.FindAsync(new object[] { id }, cancellationToken);
            if (user is null)
            {
                return ServiceResult.NotFound($"User with id {id} was not found.");
            }

            var email = NormalizeEmail(request.Email);
            if (await EmailExistsAsync(email, id, cancellationToken))
            {
                return ServiceResult.Conflict("A user with this email already exists.");
            }

            user.Email = email;
            user.ContactNumber = NormalizeOptional(request.ContactNumber);
            user.FirstName = request.FirstName.Trim();
            user.MiddleName = NormalizeOptional(request.MiddleName);
            user.LastName = request.LastName.Trim();
            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                user.Password = BCrypt.Net.BCrypt.HashPassword(request.Password);
            }

            try
            {
                await context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                return ServiceResult.Conflict("A user with this email already exists.");
            }
            return ServiceResult.Success();
        }

        public async Task<ServiceResult> DeleteAsync(int id, CancellationToken cancellationToken)
        {
            var user = await context.Users.FindAsync(new object[] { id }, cancellationToken);
            if (user is null)
            {
                return ServiceResult.NotFound($"User with id {id} was not found.");
            }

            var hasBookings = await context.Bookings.AnyAsync(booking => booking.UserId == id, cancellationToken);
            if (hasBookings)
            {
                return ServiceResult.Conflict("Users with bookings cannot be deleted.");
            }

            try
            {
                context.Users.Remove(user);
                await context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                return ServiceResult.Conflict("Users with bookings cannot be deleted.");
            }

            return ServiceResult.Success();
        }

        private static string NormalizeOptional(string? value)
        {
            return value?.Trim() ?? string.Empty;
        }

        private async Task<bool> EmailExistsAsync(string email, int? excludedUserId, CancellationToken cancellationToken)
        {
            return await context.Users.AnyAsync(
                user => user.Email == email && (!excludedUserId.HasValue || user.Id != excludedUserId.Value),
                cancellationToken);
        }

        private static string NormalizeEmail(string email)
        {
            return email.Trim().ToLowerInvariant();
        }

        private static UserDto ToDto(User user)
        {
            return new UserDto(
                user.Id,
                user.Email,
                user.ContactNumber,
                user.FirstName,
                user.MiddleName,
                user.LastName,
                user.Role,
                user.CreatedAt,
                user.Bookings.Count(),
                user.Bookings.Count(booking =>
                    booking.Status == BookingStatus.Pending ||
                    booking.Status == BookingStatus.Confirmed),
                user.Bookings.Count(booking => booking.Status == BookingStatus.Pending),
                user.Bookings.Count(booking => booking.Status == BookingStatus.Confirmed));
        }
    }
}
