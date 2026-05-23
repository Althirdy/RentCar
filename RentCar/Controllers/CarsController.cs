using Microsoft.AspNetCore.Mvc;
using RentCar.DTOs.Cars;
using RentCar.Services;
using RentCar.Services.Cars;

namespace RentCar.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public sealed class CarsController(ICarService carService) : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<CarDto>>> GetAll(CancellationToken cancellationToken)
        {
            var cars = await carService.GetAllAsync(cancellationToken);
            return Ok(cars);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CarDto>> GetById(int id, CancellationToken cancellationToken)
        {
            var car = await carService.GetByIdAsync(id, cancellationToken);
            return car is null
                ? Problem(title: $"Car with id {id} was not found.", statusCode: StatusCodes.Status404NotFound)
                : Ok(car);
        }

        [HttpPost]
        public async Task<ActionResult<CarDto>> Create(CreateCarRequest request, CancellationToken cancellationToken)
        {
            var result = await carService.CreateAsync(request, cancellationToken);
            if (!result.IsSuccess)
            {
                return ToActionResult(result);
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, UpdateCarRequest request, CancellationToken cancellationToken)
        {
            var result = await carService.UpdateAsync(id, request, cancellationToken);
            return result.IsSuccess ? NoContent() : ToActionResult(result);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var result = await carService.DeleteAsync(id, cancellationToken);
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
