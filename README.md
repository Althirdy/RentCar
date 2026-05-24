# RentCar

RentCar is a local development car rental admin app. It includes an ASP.NET Core API, SQL Server, and a Next.js admin frontend for managing fleet inventory, customers, bookings, and rental availability.

## Stack

- Backend: ASP.NET Core Web API on .NET 10
- Database: SQL Server 2022
- ORM: Entity Framework Core
- Frontend: Next.js 16, React 19, TypeScript
- UI: shadcn/ui, Tailwind CSS, lucide-react
- Local runtime: Docker Compose

## Features

- Admin dashboard with fleet, customer, booking, and estimated value metrics
- Cars CRUD for rental inventory, pricing, status, fuel type, transmission, and seats
- Bookings admin page for confirming or cancelling renter booking requests
- Customers admin page with booking activity counts
- Rental calendar with Month, Week, and List views
- Development seed data for users, cars, and bookings
- API startup migrations and seeding for fresh Docker databases

## Services

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:3000` |
| API | `http://localhost:5074` |
| API health | `http://localhost:5074/health` |
| SQL Server | `localhost:1433` |

## Quick Start

### Prerequisites

- Docker Desktop
- Git

The Docker setup runs the database, backend API, and frontend. You do not need to open Visual Studio or run the Next.js app separately for normal development.

### Start the app

```bash
docker compose up -d --build
```

Open the frontend:

```text
http://localhost:3000
```

### Stop the app

```bash
docker compose down
```

### Reset development data

Use this when you want fresh seed data, including sample bookings:

```bash
docker compose down -v
docker compose up -d --build
```

## Development Workflow

For daily startup after the images are already built:

```bash
docker compose up -d
```

Rebuild after changing Dockerfiles, Compose configuration, or package/project dependency files:

```bash
docker compose up -d --build
```

The frontend container runs:

```bash
npm run dev:docker
```

That uses Next.js Webpack mode for more reliable file watching inside Docker on Windows. Local non-Docker frontend development can still use:

```bash
cd client
npm run dev
```

## Database Startup

The API prepares the development database on startup:

1. SQL Server starts and passes its healthcheck.
2. The API starts.
3. EF Core applies existing migrations with `Database.Migrate()`.
4. Development seeders insert users, cars, and bookings when tables are empty.
5. The API health endpoint responds.
6. The frontend starts after the API is healthy.

No manual `Update-Database` step is needed for Docker development.

## Seed Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@carrental.com` | `Admin@123` |
| Renter | `juan@email.com` | `Renter@123` |

Authentication UI is not implemented yet. These accounts are development seed data for backend and future auth work.

## Sample Data

The development seeders create:

- active rental cars
- one renter and one admin
- pending, confirmed, and cancelled bookings
- overlapping confirmed bookings for different cars so the calendar can show multiple rentals on the same date

If you already have a database volume, seed changes will not appear until you reset the volume with:

```bash
docker compose down -v
docker compose up -d --build
```

## Useful Checks

Check running containers:

```bash
docker compose ps
```

Check API logs:

```bash
docker compose logs api
```

Check frontend logs:

```bash
docker compose logs web
```

Validate Compose configuration:

```bash
docker compose config
```

Frontend quality checks:

```bash
cd client
npm run typecheck
npm run lint
```

## Troubleshooting

### Frontend shows `Failed to fetch`

Check that the API is healthy:

```text
http://localhost:5074/health
```

Then check API logs:

```bash
docker compose logs api
```

If the logs mention `Cannot open database "CarRentalDb"`, rebuild after the latest migration startup fix:

```bash
docker compose up -d --build api
```

### New seed data does not show

Seeders skip when records already exist. Reset the database volume:

```bash
docker compose down -v
docker compose up -d --build
```

### Frontend route or UI change does not appear

Most edits should hot reload. If a newly added Next.js route does not appear, restart only the frontend container:

```bash
docker compose restart web
```

If Docker or package files changed, rebuild the frontend:

```bash
docker compose up -d --build web
```

## Current Scope

Implemented:

- Admin dashboard
- Cars CRUD
- Bookings review and status management
- Customers management
- Rental calendar
- Docker development stack

Not implemented yet:

- login/auth UI
- production Docker setup
- renter-facing booking flow
- maintenance scheduling
- deployment configuration
