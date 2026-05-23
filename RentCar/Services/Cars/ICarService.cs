using RentCar.DTOs.Cars;

namespace RentCar.Services.Cars
{
    public interface ICarService
    {
        Task<IReadOnlyList<CarDto>> GetAllAsync(CancellationToken cancellationToken);
        Task<CarDto?> GetByIdAsync(int id, CancellationToken cancellationToken);
        Task<ServiceResult<CarDto>> CreateAsync(CreateCarRequest request, CancellationToken cancellationToken);
        Task<ServiceResult> UpdateAsync(int id, UpdateCarRequest request, CancellationToken cancellationToken);
        Task<ServiceResult> DeleteAsync(int id, CancellationToken cancellationToken);
    }
}
