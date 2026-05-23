using RentCar.DTOs.Users;

namespace RentCar.Services.Users
{
    public interface IUserService
    {
        Task<IReadOnlyList<UserDto>> GetAllAsync(CancellationToken cancellationToken);
        Task<UserDto?> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<ServiceResult<UserDto>> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken);
        Task<ServiceResult> UpdateAsync(int id, UpdateUserRequest request, CancellationToken cancellationToken);
        Task<ServiceResult> DeleteAsync(int id, CancellationToken cancellationToken);
    }
}
