using RentCar.Models;
using RentCar.Models.Enums;

namespace RentCar.Data.Seeders
{
    public static class UserSeeder
    {
        public static void Seed(AppDbContext context)
        {
            if (context.Users.Any()) return;
            var users = new List<User>
    {
        new User
        {
            FirstName = "Admin",
            MiddleName = "",
            LastName = "User",
            Email = "admin@carrental.com",
            ContactNumber = "+639171234567",
            Password = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role = RoleType.Admin,
            CreatedAt = DateTime.UtcNow
        },
        new User
        {
            FirstName = "Juan",
            MiddleName = "dela",
            LastName = "Cruz",
            Email = "juan@email.com",
            ContactNumber = "+639281234567",
            Password = BCrypt.Net.BCrypt.HashPassword("Renter@123"),
            Role = RoleType.Renter,
            CreatedAt = DateTime.UtcNow
        }
    };

            context.Users.AddRange(users);
            context.SaveChanges();
        }
    }
}
