export type CarStatus = "Active" | "Rented" | "UnderMaintenance" | "Retired"
export type FuelType = "Diesel" | "Gasoline" | "Electric"
export type TransmissionType = "Automatic" | "Manual"
export type BookingStatus = "Pending" | "Confirmed" | "Cancelled"
export type RoleType = "Renter" | "Admin"

export type CarDto = {
  id: number
  maker: string
  model: string
  year: number
  imageUrl: string
  pricePerDay: number
  status: CarStatus
  fuelType: FuelType
  transmissionType: TransmissionType
  seats: number
}

export type CreateCarRequest = {
  maker: string
  model: string
  year: number
  imageUrl: string
  pricePerDay: number
  status: CarStatus
  fuelType: FuelType
  transmissionType: TransmissionType
  seats: number
}

export type UpdateCarRequest = CreateCarRequest

export type UserDto = {
  id: number
  email: string
  contactNumber: string
  firstName: string
  middleName: string
  lastName: string
  role: RoleType
  createdAt: string
  bookingCount: number
  activeBookingCount: number
  pendingBookingCount: number
  confirmedBookingCount: number
}

export type CreateUserRequest = {
  email: string
  contactNumber: string
  firstName: string
  middleName: string
  lastName: string
  password: string
}

export type UpdateUserRequest = {
  email: string
  contactNumber: string
  firstName: string
  middleName: string
  lastName: string
  password?: string
}

export type BookingDto = {
  id: number
  carId: number
  userId: number
  renter: BookingRenterDto
  car: BookingCarDto
  startDate: string
  endDate: string
  totalPrice: number
  status: BookingStatus
  createdAt: string
}

export type BookingRenterDto = {
  id: number
  firstName: string
  middleName: string
  lastName: string
  email: string
  contactNumber: string
}

export type BookingCarDto = {
  id: number
  maker: string
  model: string
  year: number
  imageUrl: string
  pricePerDay: number
}

export type UpdateBookingRequest = {
  carId: number
  userId: number
  startDate: string
  endDate: string
  status: BookingStatus
}

export type ProblemDetails = {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errors?: Record<string, string[]>
}

export type DashboardSummary = {
  cars: CarDto[]
  users: UserDto[]
  bookings: BookingDto[]
}
