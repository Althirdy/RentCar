using RentCar.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RentCar.Models
{
    public class Car
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Maker { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Model { get; set; } = string.Empty;

        [Required]
        public int Year { get; set; }

        [MaxLength(500)]
        public string ImageUrl { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(8,2)")]
        public decimal PricePerDay { get; set; }

        [Required]
        public CarStatus Status { get; set; } = CarStatus.Active;

        [Required]
        public FuelType FuelType { get; set; }

        [Required]
        public TransmissionType TransmissionType { get; set; }

        [Required]
        public int Seats { get; set; }

        //Navigation Properties
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
