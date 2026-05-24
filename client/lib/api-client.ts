import type {
  BookingDto,
  CarDto,
  CreateCarRequest,
  CreateUserRequest,
  DashboardSummary,
  ProblemDetails,
  UpdateBookingRequest,
  UpdateCarRequest,
  UpdateUserRequest,
  UserDto,
} from "@/lib/api-types"

const fallbackApiBaseUrl = "http://localhost:5074"

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? fallbackApiBaseUrl

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`

    try {
      const problem = (await response.json()) as ProblemDetails
      message = problem.title ?? problem.detail ?? message
    } catch {
      // Keep the status message when the API returns no JSON body.
    }

    throw new Error(message)
  }

  return (await response.json()) as T
}

async function sendJson<T>(path: string, method: "POST" | "PUT", body: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

async function deleteJson(path: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }
}

async function getErrorMessage(response: Response) {
  let message = `Request failed with status ${response.status}`

  try {
    const problem = (await response.json()) as ProblemDetails
    message = problem.title ?? problem.detail ?? message
  } catch {
    // Keep the status message when the API returns no JSON body.
  }

  return message
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [cars, users, bookings] = await Promise.all([
    getJson<CarDto[]>("/api/cars"),
    getJson<UserDto[]>("/api/users"),
    getJson<BookingDto[]>("/api/bookings"),
  ])

  return { cars, users, bookings }
}

export async function getCars(): Promise<CarDto[]> {
  return getJson<CarDto[]>("/api/cars")
}

export async function createCar(request: CreateCarRequest): Promise<CarDto> {
  return sendJson<CarDto>("/api/cars", "POST", request)
}

export async function updateCar(id: number, request: UpdateCarRequest): Promise<void> {
  await sendJson<void>(`/api/cars/${id}`, "PUT", request)
}

export async function deleteCar(id: number): Promise<void> {
  await deleteJson(`/api/cars/${id}`)
}

export async function getBookings(): Promise<BookingDto[]> {
  return getJson<BookingDto[]>("/api/bookings")
}

export async function updateBooking(id: number, request: UpdateBookingRequest): Promise<void> {
  await sendJson<void>(`/api/bookings/${id}`, "PUT", request)
}

export async function getUsers(): Promise<UserDto[]> {
  return getJson<UserDto[]>("/api/users")
}

export async function createUser(request: CreateUserRequest): Promise<UserDto> {
  return sendJson<UserDto>("/api/users", "POST", request)
}

export async function updateUser(id: number, request: UpdateUserRequest): Promise<void> {
  await sendJson<void>(`/api/users/${id}`, "PUT", request)
}

export async function deleteUser(id: number): Promise<void> {
  await deleteJson(`/api/users/${id}`)
}
