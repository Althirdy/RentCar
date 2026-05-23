using Microsoft.AspNetCore.Mvc;
using RentCar.DTOs.Users;
using RentCar.Services;
using RentCar.Services.Users;

namespace RentCar.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public sealed class UsersController(IUserService userService) : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<UserDto>>> GetAll(CancellationToken cancellationToken)
        {
            var users = await userService.GetAllAsync(cancellationToken);
            return Ok(users);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<UserDto>> GetById(int id, CancellationToken cancellationToken)
        {
            var user = await userService.GetByIdAsync(id, cancellationToken);
            return user is null
                ? Problem(title: $"User with id {id} was not found.", statusCode: StatusCodes.Status404NotFound)
                : Ok(user);
        }

        [HttpPost]
        public async Task<ActionResult<UserDto>> Create(CreateUserRequest request, CancellationToken cancellationToken)
        {
            var result = await userService.CreateAsync(request, cancellationToken);
            if (!result.IsSuccess)
            {
                return ToActionResult(result);
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, UpdateUserRequest request, CancellationToken cancellationToken)
        {
            var result = await userService.UpdateAsync(id, request, cancellationToken);
            return result.IsSuccess ? NoContent() : ToActionResult(result);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var result = await userService.DeleteAsync(id, cancellationToken);
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
