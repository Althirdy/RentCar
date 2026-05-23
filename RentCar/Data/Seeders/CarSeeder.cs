using RentCar.Models;
using RentCar.Models.Enums;

namespace RentCar.Data.Seeders
{
    public static class CarSeeder
    {
        public static void Seed(AppDbContext context)
        {
            if (context.Cars.Any()) return;
            var cars = new List<Car>
        {
            new Car
            {
                Maker = "Toyota",
                Model = "Camry",
                Year = 2022,
                ImageUrl = "https://placehold.co/600x400?text=Toyota+Camry",
                PricePerDay = 1500,
                Status = CarStatus.Active,
                FuelType = FuelType.Gasoline,
                TransmissionType = TransmissionType.Automatic,
                Seats = 5
            },
            new Car
            {
                Maker = "Honda",
                Model = "CR-V",
                Year = 2023,
                ImageUrl = "https://placehold.co/600x400?text=Honda+CRV",
                PricePerDay = 2000,
                Status = CarStatus.Active,
                FuelType = FuelType.Gasoline,
                TransmissionType = TransmissionType.Automatic,
                Seats = 7
            },
            new Car
            {
                Maker = "Mitsubishi",
                Model = "Montero Sport",
                Year = 2021,
                ImageUrl = "https://placehold.co/600x400?text=Montero+Sport",
                PricePerDay = 2500,
                Status = CarStatus.Active,
                FuelType = FuelType.Diesel,
                TransmissionType = TransmissionType.Automatic,
                Seats = 7
            },
            new Car
            {
                Maker = "Ford",
                Model = "Ranger",
                Year = 2022,
                ImageUrl = "https://placehold.co/600x400?text=Ford+Ranger",
                PricePerDay = 2200,
                Status = CarStatus.UnderMaintenance,
                FuelType = FuelType.Diesel,
                TransmissionType = TransmissionType.Manual,
                Seats = 5
            },
            new Car
            {
                Maker = "Tesla",
                Model = "Model 3",
                Year = 2023,
                ImageUrl = "https://placehold.co/600x400?text=Tesla+Model+3",
                PricePerDay = 3500,
                Status = CarStatus.Active,
                FuelType = FuelType.Electric,
                TransmissionType = TransmissionType.Automatic,
                Seats = 5
            }
        };

            context.Cars.AddRange(cars);
            context.SaveChanges();
        }
    }
}
