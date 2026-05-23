using Microsoft.EntityFrameworkCore;
using RentCar.Models;

namespace RentCar.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions options) : base(options)
        {
        }

        public DbSet<Car> Cars { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Booking> Bookings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ── Car ──────────────────────────────────────────────
            modelBuilder.Entity<Car>(entity =>
            {
                // Store enums as strings for readability in the DB
                entity.Property(c => c.Status)
                    .HasConversion<string>();

                entity.Property(c => c.FuelType)
                    .HasConversion<string>();

                entity.Property(c => c.TransmissionType)
                    .HasConversion<string>();

                // Indexes
                entity.HasIndex(c => c.Status);
                entity.HasIndex(c => c.Maker);
                entity.HasIndex(c => c.PricePerDay);
            });

            // ── User ─────────────────────────────────────────────
            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(u => u.Role)
                    .HasConversion<string>();

                // Unique index on email (used for login)
                entity.HasIndex(u => u.Email)
                    .IsUnique();

                entity.HasIndex(u => u.Role);
            });

            // ── Booking ──────────────────────────────────────────
            modelBuilder.Entity<Booking>(entity =>
            {
                entity.Property(b => b.Status)
                    .HasConversion<string>();

                // FK indexes
                entity.HasIndex(b => b.CarId);
                entity.HasIndex(b => b.UserId);
                entity.HasIndex(b => b.Status);

                // Composite index for availability date range queries
                entity.HasIndex(b => new { b.CarId, b.StartDate, b.EndDate })
                    .HasDatabaseName("IX_Booking_CarId_StartDate_EndDate");

                // Relationships
                entity.HasOne(b => b.Car)
                    .WithMany(c => c.Bookings)
                    .HasForeignKey(b => b.CarId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(b => b.User)
                    .WithMany(u => u.Bookings)
                    .HasForeignKey(b => b.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
