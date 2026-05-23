using Microsoft.AspNetCore.Mvc;
using RentCar.DTOs.Bookings;
using RentCar.Services;
using RentCar.Services.Bookings;

namespace RentCar.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public sealed class BookingsController(IBookingService bookingService) : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<BookingDto>>> GetAll(CancellationToken cancellationToken)
        {
            var bookings = await bookingService.GetAllAsync(cancellationToken);
            return Ok(bookings);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<BookingDto>> GetById(int id, CancellationToken cancellationToken)
        {
            var booking = await bookingService.GetByIdAsync(id, cancellationToken);
            return booking is null
                ? Problem(title: $"Booking with id {id} was not found.", statusCode: StatusCodes.Status404NotFound)
                : Ok(booking);
        }

        [HttpPost]
        public async Task<ActionResult<BookingDto>> Create(CreateBookingRequest request, CancellationToken cancellationToken)
        {
            var result = await bookingService.CreateAsync(request, cancellationToken);
            if (!result.IsSuccess)
            {
                return ToActionResult(result);
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, UpdateBookingRequest request, CancellationToken cancellationToken)
        {
            var result = await bookingService.UpdateAsync(id, request, cancellationToken);
            return result.IsSuccess ? NoContent() : ToActionResult(result);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var result = await bookingService.DeleteAsync(id, cancellationToken);
            return result.IsSuccess ? NoContent() : ToActionResult(result);
        }

        private ActionResult ToActionResult<T>(ServiceResult<T> result) =>
            ToActionResult(result.ErrorType, result.ErrorMessage);

        private ActionResult ToActionResult(ServiceResult result) =>
            ToActionResult(result.ErrorType, result.ErrorMessage);

        private ActionResult ToActionResult(ServiceErrorType errorType, string? message)
        {
            var statusCode = errorType switch
            {
                ServiceErrorType.NotFound => StatusCodes.Status404NotFound,
                ServiceErrorType.Conflict => StatusCodes.Status409Conflict,
                ServiceErrorType.Validation => StatusCodes.Status400BadRequest,
                _ => StatusCodes.Status400BadRequest
            };

            return errorType switch
            {
                ServiceErrorType.NotFound => Problem(title: message, statusCode: statusCode),
                ServiceErrorType.Conflict => Problem(title: message, statusCode: statusCode),
                ServiceErrorType.Validation => Problem(title: message, statusCode: statusCode),
                _ => Problem(title: message, statusCode: statusCode)
            };
        }
    }
}
