using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using RentCar.Data;
using RentCar.Data.Seeders;
using RentCar.Services.Bookings;
using RentCar.Services.Cars;
using RentCar.Services.Users;

var builder = WebApplication.CreateBuilder(args);

const string NextJsCorsPolicy = "NextJsDev";

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(allowIntegerValues: false));
    });
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddPolicy(NextJsCorsPolicy, policy =>
    {
        policy
            .WithOrigins("http://localhost:3000", "http://localhost:3001")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration
        .GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<ICarService, CarService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IBookingService, BookingService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors(NextJsCorsPolicy);

app.UseAuthorization();

app.MapControllers();
app.MapGet("/health", () => Results.Ok());

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.Migrate();
    DatabaseSeeder.Seed(context);
}

app.Run();
