namespace RentCar.Services
{
    public enum ServiceErrorType
    {
        None,
        Validation,
        NotFound,
        Conflict
    }

    public sealed record ServiceResult<T>(
        bool IsSuccess,
        T? Value,
        ServiceErrorType ErrorType,
        string? ErrorMessage)
    {
        public static ServiceResult<T> Success(T value) =>
            new(true, value, ServiceErrorType.None, null);

        public static ServiceResult<T> Validation(string message) =>
            new(false, default, ServiceErrorType.Validation, message);

        public static ServiceResult<T> NotFound(string message) =>
            new(false, default, ServiceErrorType.NotFound, message);

        public static ServiceResult<T> Conflict(string message) =>
            new(false, default, ServiceErrorType.Conflict, message);
    }

    public sealed record ServiceResult(
        bool IsSuccess,
        ServiceErrorType ErrorType,
        string? ErrorMessage)
    {
        public static ServiceResult Success() =>
            new(true, ServiceErrorType.None, null);

        public static ServiceResult Validation(string message) =>
            new(false, ServiceErrorType.Validation, message);

        public static ServiceResult NotFound(string message) =>
            new(false, ServiceErrorType.NotFound, message);

        public static ServiceResult Conflict(string message) =>
            new(false, ServiceErrorType.Conflict, message);
    }
}
