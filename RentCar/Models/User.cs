using RentCar.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace RentCar.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [MaxLength(15)]
        public string ContactNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string MiddleName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public RoleType Role { get; set; } = RoleType.Renter;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        //Navigation Properties
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
