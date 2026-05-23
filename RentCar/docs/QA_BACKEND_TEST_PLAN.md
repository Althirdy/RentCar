# Backend QA Test Plan Before Next.js

## Objective
Validate the ASP.NET Core backend before building the Next.js frontend. The frontend should only begin API integration after the CRUD endpoints, response DTOs, seed data, and booking rules are stable.

## Environment
- API base URL: `http://localhost:5074`
- Optional HTTPS URL: `https://localhost:7146`
- Next.js dev origins allowed by CORS: `http://localhost:3000`, `http://localhost:3001`
- Database: SQL Server container from `docker-compose.yml`
- Database name: `CarRentalDb`
- Smoke request file: `RentCar.http`

## API Contract Notes
- Enum values are JSON strings, for example `Active`, `Gasoline`, `Automatic`, `Pending`, and `Cancelled`.
- API error responses should use `ProblemDetails`-style objects for service-level `400`, `404`, and `409` responses.
- User response DTOs must never include `password` or password hashes.
- Smoke booking dates intentionally use far-future valid dates and one clearly past date for negative validation.

## Entry Criteria
- SQL Server container is running and healthy.
- Backend starts in Development environment.
- Initial migration has been applied.
- Runtime seeders create users and cars.
- `GET /openapi/v1.json` returns `200 OK`.

## P0 Smoke Tests

| ID | Area | Scenario | Expected |
| --- | --- | --- | --- |
| API-P0-001 | OpenAPI | Request `/openapi/v1.json` | `200 OK` with OpenAPI JSON |
| API-P0-002 | Cars | `GET /api/cars` | `200 OK` with seeded cars |
| API-P0-003 | Cars | Create, fetch, update, delete a car | `201`, `200`, `204`, `204` |
| API-P0-004 | Users | `GET /api/users` | `200 OK`; response does not contain `password` |
| API-P0-005 | Users | Create duplicate email | first call `201`, duplicate call `409` |
| API-P0-006 | Bookings | Create valid booking | `201`; status is `Pending`; total price is server-calculated |
| API-P0-007 | Bookings | Create overlapping booking | `409 Conflict` |
| API-P0-008 | Bookings | Invalid booking dates | `400 Bad Request` |
| API-P0-009 | Bookings | Missing car/user references | `404 Not Found` |

## P1 Regression Tests

| ID | Area | Scenario | Expected |
| --- | --- | --- | --- |
| API-P1-001 | Cars | Missing car lookup | `404 Not Found` |
| API-P1-002 | Cars | Delete car with booking | `409 Conflict` |
| API-P1-003 | Users | Update user password | response hides password; stored value should be a BCrypt hash |
| API-P1-004 | Users | Delete user with booking | `409 Conflict` |
| API-P1-005 | Bookings | Cancel booking, then create same date range | cancel returns `204`; new booking returns `201` |
| API-P1-006 | Bookings | Update booking dates/car | `204`; later fetch shows recalculated `totalPrice` |

## Manual Execution Steps
1. Start SQL Server with `docker compose up -d db`.
2. Start the API on `http://localhost:5074`.
3. Open `RentCar.http` in an HTTP client that supports `.http` files.
4. Run requests from top to bottom.
5. Record status codes and inspect response bodies.
6. Stop at the first P0 failure and fix backend behavior before continuing.

## Static Review Gate
Use this subagent prompt before frontend API integration:

```text
Act as a senior ASP.NET Core, EF Core, and API QA reviewer. Static review only. Do not edit files and do not run dotnet build/test. Inspect the RentCar backend CRUD implementation for Cars, Users, and Bookings. Check API response consistency, DTO safety, EF Core async usage, validation, transactions, password exposure, booking overlap logic, delete behavior, and frontend readiness. Return prioritized findings with file paths and exact risks.
```

## Automated Test Backlog
Create `RentCar.Tests` later with integration tests around the public API using `WebApplicationFactory<Program>`.

Prioritize:
- Cars CRUD happy path.
- Users CRUD with password hidden and duplicate email blocked.
- Bookings happy path with computed total.
- Booking overlap conflict.
- Booking invalid dates.
- Delete conflicts for cars/users with bookings.

## Exit Criteria
- All P0 smoke tests pass.
- No user API response exposes `Password`.
- Booking validation handles valid, invalid, past, and overlapping date ranges.
- DTO response shapes are stable enough for frontend TypeScript types.
- All P0/P1 backend bugs are fixed or explicitly deferred.
- `RentCar.http` works as living API documentation for the frontend.
