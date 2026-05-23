using RentCar.Models.Enums;

namespace RentCar.DTOs.Cars
{
    public sealed record CarDto(
        int Id,
        string Maker,
        string Model,
        int Year,
        string ImageUrl,
        decimal PricePerDay,
        CarStatus Status,
        FuelType FuelType,
        TransmissionType TransmissionType,
        int Seats);
}
