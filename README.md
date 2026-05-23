# 🚗 Car Rental API

A simple Car Rental REST API built with **ASP.NET Core** and **Entity Framework Core** as a learning project.

## Tech Stack

- **Backend:** C# ASP.NET Core Web API (.NET 10)
- **Database:** SQL Server 2022 (Docker)
- **ORM:** Entity Framework Core 10
- **Auth:** JWT Bearer *(in progress)*
- **Frontend:** Next.js *(planned)*

## Features

- Car listings with status, fuel type, and transmission type
- User registration with hashed passwords
- Booking management
- Role-based access: `Admin` and `Renter`
- Database seeding for development

## Getting Started

### Prerequisites
- .NET 10 SDK
- Docker Desktop

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/carrental-api.git
cd carrental-api
```

### 2. Start the database
```bash
docker compose up -d
```

### 3. Apply migrations
```powershell
Update-Database
```

### 4. Run the API
```bash
dotnet run
```

Swagger is available at `https://localhost:{port}/swagger`

## Seeder Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@carrental.com | Admin@123 |
| Renter | juan@email.com | Renter@123 |

## Project Status

- [x] Models & Migrations
- [x] Database Seeding
- [x] Cars CRUD
- [x] Bookings CRUD
- [x] Users CRUD
- [ ] Auth (JWT)
- [ ] DTOs
- [ ] Availability Check
- [ ] Next.js Frontend
