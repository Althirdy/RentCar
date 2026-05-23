using System.ComponentModel.DataAnnotations;
using RentCar.Models.Enums;

namespace RentCar.DTOs.Cars
{
    public sealed record UpdateCarRequest(
        [Required, MaxLength(50)] string Maker,
        [Required, MaxLength(50)] string Model,
        [Range(1886, 3000)] int Year,
        [MaxLength(500)] string ImageUrl,
        [Range(0.01, 999999.99)] decimal PricePerDay,
        CarStatus Status,
        FuelType FuelType,
        TransmissionType TransmissionType,
        [Range(1, 100)] int Seats);
}
