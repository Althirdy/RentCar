namespace RentCar.Data.Seeders
{
    public static class DatabaseSeeder
    {
        public static void Seed(AppDbContext context)
        {
            UserSeeder.Seed(context);
            CarSeeder.Seed(context);
        }
    }
}
