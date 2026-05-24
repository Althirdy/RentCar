"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarClock, Check, CircleAlert, Eye, X } from "lucide-react"
import { toast } from "sonner"

import { AdminShell } from "@/components/dashboard/admin-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getBookings, updateBooking } from "@/lib/api-client"
import type { BookingDto, BookingStatus, UpdateBookingRequest } from "@/lib/api-types"
import { BookingStatusDialog } from "@/components/bookings/booking-status-dialog"

type BookingsState =
  | { status: "loading"; bookings?: undefined; error?: undefined }
  | { status: "success"; bookings: BookingDto[]; error?: undefined }
  | { status: "error"; bookings?: undefined; error: string }

type BookingAction = {
  booking: BookingDto
  status: Exclude<BookingStatus, "Pending">
} | null

const emptyBookings: BookingDto[] = []

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

export function BookingsPage() {
  const [state, setState] = useState<BookingsState>({ status: "loading" })
  const [pendingAction, setPendingAction] = useState<BookingAction>(null)
  const [submitting, setSubmitting] = useState(false)

  async function loadBookings() {
    setState({ status: "loading" })

    try {
      const bookings = await getBookings()
      setState({ status: "success", bookings })
    } catch (error) {
      setState({
        status: "error",
        error: error instanceof Error ? error.message : "Unable to load bookings.",
      })
    }
  }

  useEffect(() => {
    let ignore = false

    getBookings()
      .then((bookings) => {
        if (!ignore) {
          setState({ status: "success", bookings })
        }
      })
      .catch((error) => {
        if (!ignore) {
          setState({
            status: "error",
            error: error instanceof Error ? error.message : "Unable to load bookings.",
          })
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  const bookings = state.status === "success" ? state.bookings : emptyBookings
  const pendingCount = useMemo(
    () => bookings.filter((booking) => booking.status === "Pending").length,
    [bookings]
  )

  async function handleStatusConfirm() {
    if (!pendingAction) {
      return
    }

    setSubmitting(true)

    try {
      await updateBooking(pendingAction.booking.id, toUpdateRequest(pendingAction.booking, pendingAction.status))
      toast.success(
        pendingAction.status === "Confirmed" ? "Booking confirmed" : "Booking cancelled"
      )
      setPendingAction(null)
      await loadBookings()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update booking.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminShell>
      <section className="space-y-1 pt-2">
        <p className="text-sm text-muted-foreground">Rental operations</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Bookings
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Review renter booking requests and manage booking status.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Booking requests</CardTitle>
          <CardDescription>
            {state.status === "success"
              ? `${bookings.length} total bookings, ${pendingCount} pending review`
              : "Track customer rentals and booking decisions."}
          </CardDescription>
          <CardAction>
            <Badge variant="outline">{pendingCount} pending</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <BookingsContent
            state={state}
            onRetry={() => void loadBookings()}
            onConfirm={(booking) => setPendingAction({ booking, status: "Confirmed" })}
            onCancel={(booking) => setPendingAction({ booking, status: "Cancelled" })}
          />
        </CardContent>
      </Card>

      <BookingStatusDialog
        action={pendingAction}
        submitting={submitting}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null)
          }
        }}
        onConfirm={handleStatusConfirm}
      />
    </AdminShell>
  )
}

function BookingsContent({
  state,
  onRetry,
  onConfirm,
  onCancel,
}: {
  state: BookingsState
  onRetry: () => void
  onConfirm: (booking: BookingDto) => void
  onCancel: (booking: BookingDto) => void
}) {
  if (state.status === "loading") {
    return <BookingsTableSkeleton />
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed p-6 text-center">
        <div className="max-w-sm">
          <CircleAlert className="mx-auto mb-3 size-5 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">Bookings are unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">{state.error}</p>
          <Button variant="outline" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (state.bookings.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed p-6 text-center">
        <div className="max-w-sm">
          <CalendarClock className="mx-auto mb-3 size-5 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">No bookings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Renter booking requests will appear here once customers reserve vehicles.
          </p>
        </div>
      </div>
    )
  }

  return (
    <BookingsTable
      bookings={state.bookings}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

function BookingsTable({
  bookings,
  onConfirm,
  onCancel,
}: {
  bookings: BookingDto[]
  onConfirm: (booking: BookingDto) => void
  onCancel: (booking: BookingDto) => void
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Booking</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Rental Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Booked On</TableHead>
            <TableHead className="w-36 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">{booking.id}</TableCell>
              <TableCell>
                <div className="font-medium">{formatRenterName(booking)}</div>
                <div className="text-sm text-muted-foreground">{booking.renter.email}</div>
              </TableCell>
              <TableCell>{booking.renter.contactNumber || "No contact number"}</TableCell>
              <TableCell>
                <div className="font-medium">{formatVehicleName(booking)}</div>
                <div className="text-sm text-muted-foreground">
                  {currencyFormatter.format(booking.car.pricePerDay)} per day
                </div>
              </TableCell>
              <TableCell>
                <div>{formatDate(booking.startDate)} to {formatDate(booking.endDate)}</div>
                <div className="text-sm text-muted-foreground">
                  {getRentalDays(booking)} {getRentalDays(booking) === 1 ? "day" : "days"}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getBookingStatusBadgeVariant(booking.status)}>
                  {booking.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {currencyFormatter.format(booking.totalPrice)}
              </TableCell>
              <TableCell>{formatDate(booking.createdAt)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  {booking.status === "Pending" ? (
                    <>
                      <Button size="icon-sm" onClick={() => onConfirm(booking)}>
                        <Check className="size-4" aria-hidden="true" />
                        <span className="sr-only">Confirm booking</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => onCancel(booking)}
                      >
                        <X className="size-4" aria-hidden="true" />
                        <span className="sr-only">Cancel booking</span>
                      </Button>
                    </>
                  ) : null}
                  {booking.status === "Confirmed" ? (
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => onCancel(booking)}
                    >
                      <X className="size-4" aria-hidden="true" />
                      <span className="sr-only">Cancel booking</span>
                    </Button>
                  ) : null}
                  {booking.status === "Cancelled" ? (
                    <Button variant="ghost" size="icon-sm" disabled>
                      <Eye className="size-4" aria-hidden="true" />
                      <span className="sr-only">Cancelled booking is read only</span>
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function BookingsTableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-4/5" />
    </div>
  )
}

function toUpdateRequest(booking: BookingDto, status: BookingStatus): UpdateBookingRequest {
  return {
    carId: booking.carId,
    userId: booking.userId,
    startDate: booking.startDate,
    endDate: booking.endDate,
    status,
  }
}

function formatRenterName(booking: BookingDto) {
  return [booking.renter.firstName, booking.renter.middleName, booking.renter.lastName]
    .filter(Boolean)
    .join(" ")
}

function formatVehicleName(booking: BookingDto) {
  return `${booking.car.year} ${booking.car.maker} ${booking.car.model}`
}

function formatDate(value: string) {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? "Invalid date" : dateFormatter.format(timestamp)
}

function getRentalDays(booking: BookingDto) {
  const start = Date.parse(booking.startDate)
  const end = Date.parse(booking.endDate)

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return 0
  }

  return Math.max(1, Math.ceil((end - start) / 86_400_000))
}

function getBookingStatusBadgeVariant(status: BookingStatus) {
  if (status === "Confirmed") {
    return "secondary"
  }

  if (status === "Cancelled") {
    return "ghost"
  }

  return "outline"
}
