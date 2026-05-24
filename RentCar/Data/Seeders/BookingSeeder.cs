using RentCar.Models;
using RentCar.Models.Enums;

namespace RentCar.Data.Seeders
{
    public static class BookingSeeder
    {
        public static void Seed(AppDbContext context)
        {
            if (context.Bookings.Any()) return;

            var renter = context.Users.FirstOrDefault(user => user.Email == "juan@email.com");
            if (renter is null) return;

            var toyotaCamry = FindActiveCar(context, "Toyota", "Camry");
            var hondaCrv = FindActiveCar(context, "Honda", "CR-V");
            var monteroSport = FindActiveCar(context, "Mitsubishi", "Montero Sport");
            var teslaModel3 = FindActiveCar(context, "Tesla", "Model 3");

            if (toyotaCamry is null || hondaCrv is null || monteroSport is null || teslaModel3 is null)
            {
                return;
            }

            var today = DateTime.UtcNow.Date;
            var bookings = new List<Booking>
            {
                CreateBooking(
                    toyotaCamry,
                    renter.Id,
                    today.AddDays(2),
                    today.AddDays(5),
                    BookingStatus.Pending,
                    today.AddDays(-1)),
                CreateBooking(
                    hondaCrv,
                    renter.Id,
                    today.AddDays(6),
                    today.AddDays(9),
                    BookingStatus.Confirmed,
                    today.AddDays(-3)),
                CreateBooking(
                    monteroSport,
                    renter.Id,
                    today.AddDays(8),
                    today.AddDays(12),
                    BookingStatus.Confirmed,
                    today.AddDays(-5)),
                CreateBooking(
                    teslaModel3,
                    renter.Id,
                    today.AddDays(-8),
                    today.AddDays(-6),
                    BookingStatus.Cancelled,
                    today.AddDays(-14))
            };

            context.Bookings.AddRange(bookings);
            context.SaveChanges();
        }

        private static Car? FindActiveCar(AppDbContext context, string maker, string model)
        {
            return context.Cars.FirstOrDefault(car =>
                car.Maker == maker &&
                car.Model == model &&
                car.Status == CarStatus.Active);
        }

        private static Booking CreateBooking(
            Car car,
            int userId,
            DateTime startDate,
            DateTime endDate,
            BookingStatus status,
            DateTime createdAt)
        {
            return new Booking
            {
                CarId = car.Id,
                UserId = userId,
                StartDate = startDate,
                EndDate = endDate,
                TotalPrice = CalculateTotalPrice(car.PricePerDay, startDate, endDate),
                Status = status,
                CreatedAt = createdAt
            };
        }

        private static decimal CalculateTotalPrice(decimal pricePerDay, DateTime startDate, DateTime endDate)
        {
            var rentalDays = Math.Max(1, (int)Math.Ceiling((endDate - startDate).TotalDays));
            return pricePerDay * rentalDays;
        }
    }
}
