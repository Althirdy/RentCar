"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Eye,
  EyeOff,
} from "lucide-react"
import { toast } from "sonner"

import { BookingStatusDialog } from "@/components/bookings/booking-status-dialog"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getBookings, updateBooking } from "@/lib/api-client"
import type { BookingDto, BookingStatus, UpdateBookingRequest } from "@/lib/api-types"

type CalendarState =
  | { status: "loading"; bookings?: undefined; error?: undefined }
  | { status: "success"; bookings: BookingDto[]; error?: undefined }
  | { status: "error"; bookings?: undefined; error: string }

type BookingAction = {
  booking: BookingDto
  status: Exclude<BookingStatus, "Pending">
} | null

type CalendarView = "month" | "week" | "list"

const emptyBookings: BookingDto[] = []
const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const calendarViews: Array<{ label: string; value: CalendarView }> = [
  { label: "Month", value: "month" },
  { label: "Week", value: "week" },
  { label: "List", value: "list" },
]

const monthFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  year: "numeric",
})

const shortDateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
})

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
})

export function RentalCalendarPage() {
  const [state, setState] = useState<CalendarState>({ status: "loading" })
  const [visibleDate, setVisibleDate] = useState(() => startOfMonth(new Date()))
  const [calendarView, setCalendarView] = useState<CalendarView>("month")
  const [selectedBooking, setSelectedBooking] = useState<BookingDto | null>(null)
  const [pendingAction, setPendingAction] = useState<BookingAction>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showCancelled, setShowCancelled] = useState(false)

  async function loadBookings() {
    setState({ status: "loading" })

    try {
      const bookings = await getBookings()
      setState({ status: "success", bookings })
    } catch (error) {
      setState({
        status: "error",
        error: error instanceof Error ? error.message : "Unable to load calendar.",
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
            error: error instanceof Error ? error.message : "Unable to load calendar.",
          })
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  const bookings = state.status === "success" ? state.bookings : emptyBookings
  const visibleBookings = useMemo(
    () =>
      bookings.filter((booking) => showCancelled || booking.status !== "Cancelled"),
    [bookings, showCancelled]
  )
  const pendingCount = bookings.filter((booking) => booking.status === "Pending").length
  const confirmedCount = bookings.filter((booking) => booking.status === "Confirmed").length

  async function handleStatusConfirm() {
    if (!pendingAction) {
      return
    }

    setSubmitting(true)

    try {
      await updateBooking(
        pendingAction.booking.id,
        toUpdateRequest(pendingAction.booking, pendingAction.status)
      )
      toast.success(
        pendingAction.status === "Confirmed" ? "Booking confirmed" : "Booking cancelled"
      )
      setSelectedBooking(null)
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
        <p className="text-sm text-muted-foreground">Fleet schedule</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Calendar
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          See which vehicles are reserved by date so the team can plan daily availability.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Rental calendar</CardTitle>
          <CardDescription>
            {state.status === "success"
              ? `${confirmedCount} confirmed rentals, ${pendingCount} pending review`
              : "Track upcoming rental availability by vehicle."}
          </CardDescription>
          <CardAction>
            <div className="flex gap-2">
              <Badge variant="secondary">{confirmedCount} confirmed</Badge>
              <Badge variant="outline">{pendingCount} pending</Badge>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <CalendarContent
            state={state}
            bookings={visibleBookings}
            calendarView={calendarView}
            visibleDate={visibleDate}
            showCancelled={showCancelled}
            onRetry={() => void loadBookings()}
            onPrevious={() => setVisibleDate(moveVisibleDate(visibleDate, calendarView, -1))}
            onNext={() => setVisibleDate(moveVisibleDate(visibleDate, calendarView, 1))}
            onToday={() => setVisibleDate(getTodayDateForView(calendarView))}
            onViewChange={(view) => {
              setCalendarView(view)
              setVisibleDate((currentDate) => normalizeDateForView(currentDate, view))
            }}
            onToggleCancelled={() => setShowCancelled((value) => !value)}
            onSelectBooking={setSelectedBooking}
          />
        </CardContent>
      </Card>

      <BookingDetailsDialog
        booking={selectedBooking}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBooking(null)
          }
        }}
        onConfirm={(booking) => setPendingAction({ booking, status: "Confirmed" })}
        onCancel={(booking) => setPendingAction({ booking, status: "Cancelled" })}
      />

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

function CalendarContent({
  state,
  bookings,
  calendarView,
  visibleDate,
  showCancelled,
  onRetry,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
  onToggleCancelled,
  onSelectBooking,
}: {
  state: CalendarState
  bookings: BookingDto[]
  calendarView: CalendarView
  visibleDate: Date
  showCancelled: boolean
  onRetry: () => void
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  onViewChange: (view: CalendarView) => void
  onToggleCancelled: () => void
  onSelectBooking: (booking: BookingDto) => void
}) {
  if (state.status === "loading") {
    return <CalendarSkeleton />
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-52 items-center justify-center rounded-md border border-dashed p-6 text-center">
        <div className="max-w-sm">
          <CircleAlert className="mx-auto mb-3 size-5 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">Calendar is unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">{state.error}</p>
          <Button variant="outline" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <h2 className="min-w-0 text-lg font-semibold lg:col-start-2 lg:row-start-1 lg:text-center">
          {getVisibleDateTitle(visibleDate, calendarView)}
        </h2>
        <div className="flex items-center lg:col-start-1 lg:row-start-1 lg:justify-start">
          <div className="inline-flex rounded-lg border bg-background p-0.5 shadow-xs">
            <Button variant="ghost" size="icon-sm" onClick={onPrevious}>
              <ChevronLeft className="size-4" aria-hidden="true" />
              <span className="sr-only">Previous period</span>
            </Button>
            <Button variant="ghost" size="sm" className="rounded-md px-3" onClick={onToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onNext}>
              <ChevronRight className="size-4" aria-hidden="true" />
              <span className="sr-only">Next period</span>
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:col-start-3 lg:row-start-1 lg:justify-end">
          <div className="inline-flex rounded-lg border bg-background p-0.5 shadow-xs">
            {calendarViews.map((view) => (
              <Button
                key={view.value}
                variant={calendarView === view.value ? "default" : "ghost"}
                size="sm"
                className="rounded-md"
                onClick={() => onViewChange(view.value)}
              >
                {view.label}
              </Button>
            ))}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="bg-background"
                onClick={onToggleCancelled}
              >
                {showCancelled ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
                <span className="sr-only">
                  {showCancelled ? "Hide cancelled bookings" : "Show cancelled bookings"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showCancelled ? "Hide cancelled bookings" : "Show cancelled bookings"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {state.bookings.length === 0 ? (
        <div className="flex min-h-52 items-center justify-center rounded-md border border-dashed p-6 text-center">
          <div className="max-w-sm">
            <CalendarClock className="mx-auto mb-3 size-5 text-muted-foreground" aria-hidden="true" />
            <p className="font-medium">No rentals scheduled</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Confirmed and pending rentals will appear here once customers reserve vehicles.
            </p>
          </div>
        </div>
      ) : (
        <CalendarViewContent
          calendarView={calendarView}
          visibleDate={visibleDate}
          bookings={bookings}
          onSelectBooking={onSelectBooking}
        />
      )}
    </div>
  )
}

function CalendarViewContent({
  calendarView,
  visibleDate,
  bookings,
  onSelectBooking,
}: {
  calendarView: CalendarView
  visibleDate: Date
  bookings: BookingDto[]
  onSelectBooking: (booking: BookingDto) => void
}) {
  if (calendarView === "week") {
    return (
      <RentalWeekGrid
        week={visibleDate}
        bookings={bookings}
        onSelectBooking={onSelectBooking}
      />
    )
  }

  if (calendarView === "list") {
    return (
      <RentalEventList
        month={visibleDate}
        bookings={bookings}
        onSelectBooking={onSelectBooking}
      />
    )
  }

  return (
    <RentalMonthGrid
      month={visibleDate}
      bookings={bookings}
      onSelectBooking={onSelectBooking}
    />
  )
}

function RentalMonthGrid({
  month,
  bookings,
  onSelectBooking,
}: {
  month: Date
  bookings: BookingDto[]
  onSelectBooking: (booking: BookingDto) => void
}) {
  const days = getCalendarDays(month)

  return (
    <div className="overflow-x-auto rounded-md border">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {weekDays.map((day) => (
            <div key={day} className="px-3 py-2 text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayBookings = bookings.filter((booking) => bookingTouchesDay(booking, day))
            const visibleDayBookings = dayBookings.slice(0, 3)
            const remainingCount = Math.max(0, dayBookings.length - visibleDayBookings.length)

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-32 border-b border-r p-2 last:border-r-0",
                  !isSameMonth(day, month) && "bg-muted/20 text-muted-foreground"
                )}
              >
                <div className="mb-2 flex justify-end">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs",
                      isToday(day) && "bg-primary text-primary-foreground"
                    )}
                  >
                    {day.getDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {visibleDayBookings.map((booking) => (
                    <button
                      key={`${booking.id}-${day.toISOString()}`}
                      type="button"
                      className={cn(
                        "block w-full truncate rounded-sm border px-2 py-1 text-left text-xs transition-colors hover:bg-muted",
                        getEventClassName(booking.status)
                      )}
                      onClick={() => onSelectBooking(booking)}
                    >
                      {formatVehicleName(booking)} - {formatRenterName(booking)}
                    </button>
                  ))}
                  {remainingCount > 0 ? (
                    <div className="px-2 text-xs text-muted-foreground">
                      +{remainingCount} more
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function RentalWeekGrid({
  week,
  bookings,
  onSelectBooking,
}: {
  week: Date
  bookings: BookingDto[]
  onSelectBooking: (booking: BookingDto) => void
}) {
  const days = getWeekDays(week)

  return (
    <div className="overflow-x-auto rounded-md border">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {days.map((day) => (
            <div key={day.toISOString()} className="px-3 py-2">
              <div className="text-sm font-medium text-muted-foreground">
                {weekDays[day.getDay()]}
              </div>
              <div
                className={cn(
                  "mt-1 flex size-7 items-center justify-center rounded-full text-sm font-medium",
                  isToday(day) && "bg-primary text-primary-foreground"
                )}
              >
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayBookings = bookings.filter((booking) => bookingTouchesDay(booking, day))

            return (
              <div key={day.toISOString()} className="min-h-64 border-r p-2 last:border-r-0">
                <div className="space-y-1">
                  {dayBookings.length > 0 ? (
                    dayBookings.map((booking) => (
                      <button
                        key={`${booking.id}-${day.toISOString()}`}
                        type="button"
                        className={cn(
                          "block w-full rounded-sm border px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted",
                          getEventClassName(booking.status)
                        )}
                        onClick={() => onSelectBooking(booking)}
                      >
                        <span className="block truncate">{formatVehicleName(booking)}</span>
                        <span className="block truncate opacity-80">{formatRenterName(booking)}</span>
                      </button>
                    ))
                  ) : (
                    <p className="px-1 py-2 text-xs text-muted-foreground">No rentals</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function RentalEventList({
  month,
  bookings,
  onSelectBooking,
}: {
  month: Date
  bookings: BookingDto[]
  onSelectBooking: (booking: BookingDto) => void
}) {
  const monthBookings = bookings
    .filter((booking) => bookingTouchesMonth(booking, month))
    .toSorted((left, right) => Date.parse(left.startDate) - Date.parse(right.startDate))

  if (monthBookings.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed p-6 text-center">
        <div className="max-w-sm">
          <CalendarClock className="mx-auto mb-3 size-5 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">No events this month</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Rentals for {monthFormatter.format(month)} will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="w-24 text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {monthBookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell>
              <div className="font-medium">{formatDateRange(booking)}</div>
              <div className="text-sm text-muted-foreground">
                {getRentalDays(booking)} {getRentalDays(booking) === 1 ? "day" : "days"}
              </div>
            </TableCell>
            <TableCell>{formatVehicleName(booking)}</TableCell>
            <TableCell>
              <div className="font-medium">{formatRenterName(booking)}</div>
              <div className="text-sm text-muted-foreground">{booking.renter.email}</div>
            </TableCell>
            <TableCell>
              <Badge variant={getBookingStatusBadgeVariant(booking.status)}>
                {booking.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {currencyFormatter.format(booking.totalPrice)}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm" onClick={() => onSelectBooking(booking)}>
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function BookingDetailsDialog({
  booking,
  onOpenChange,
  onConfirm,
  onCancel,
}: {
  booking: BookingDto | null
  onOpenChange: (open: boolean) => void
  onConfirm: (booking: BookingDto) => void
  onCancel: (booking: BookingDto) => void
}) {
  return (
    <Dialog open={Boolean(booking)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{booking ? formatVehicleName(booking) : "Rental details"}</DialogTitle>
          <DialogDescription>
            {booking ? `Reserved for ${formatRenterName(booking)}` : "Review rental details."}
          </DialogDescription>
        </DialogHeader>

        {booking ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">{formatDateRange(booking)}</p>
                <p className="text-sm text-muted-foreground">{getRentalDays(booking)} rental days</p>
              </div>
              <Badge variant={getBookingStatusBadgeVariant(booking.status)}>
                {booking.status}
              </Badge>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <DetailItem label="Customer" value={formatRenterName(booking)} />
              <DetailItem label="Contact" value={booking.renter.contactNumber || "No contact number"} />
              <DetailItem label="Email" value={booking.renter.email} />
              <DetailItem label="Vehicle" value={formatVehicleName(booking)} />
              <DetailItem label="Daily rate" value={currencyFormatter.format(booking.car.pricePerDay)} />
              <DetailItem label="Total" value={currencyFormatter.format(booking.totalPrice)} />
            </div>
          </div>
        ) : null}

        {booking ? (
          <DialogFooter>
            {booking.status === "Pending" ? (
              <>
                <Button variant="destructive" onClick={() => onCancel(booking)}>
                  Cancel booking
                </Button>
                <Button onClick={() => onConfirm(booking)}>Confirm booking</Button>
              </>
            ) : null}
            {booking.status === "Confirmed" ? (
              <Button variant="destructive" onClick={() => onCancel(booking)}>
                Cancel booking
              </Button>
            ) : null}
            {booking.status === "Cancelled" ? (
              <Button variant="outline" disabled>
                Read only
              </Button>
            ) : null}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-[560px] w-full" />
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

function getCalendarDays(month: Date) {
  const firstVisibleDay = startOfWeek(startOfMonth(month))
  const days: Date[] = []

  for (let index = 0; index < 42; index += 1) {
    days.push(addDays(firstVisibleDay, index))
  }

  return days
}

function getWeekDays(week: Date) {
  const firstVisibleDay = startOfWeek(week)
  const days: Date[] = []

  for (let index = 0; index < 7; index += 1) {
    days.push(addDays(firstVisibleDay, index))
  }

  return days
}

function bookingTouchesDay(booking: BookingDto, day: Date) {
  const start = parseDateOnly(booking.startDate)
  const end = parseDateOnly(booking.endDate)

  return day >= start && day <= end
}

function bookingTouchesMonth(booking: BookingDto, month: Date) {
  const start = parseDateOnly(booking.startDate)
  const end = parseDateOnly(booking.endDate)
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)

  return start <= monthEnd && end >= monthStart
}

function parseDateOnly(value: string) {
  const date = new Date(value)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

function endOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0)
}

function startOfWeek(value: Date) {
  return addDays(value, -value.getDay())
}

function addDays(value: Date, days: number) {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date
}

function addMonths(value: Date, months: number) {
  return new Date(value.getFullYear(), value.getMonth() + months, 1)
}

function moveVisibleDate(value: Date, calendarView: CalendarView, direction: -1 | 1) {
  if (calendarView === "week") {
    return addDays(value, direction * 7)
  }

  return addMonths(value, direction)
}

function getTodayDateForView(calendarView: CalendarView) {
  const today = new Date()

  if (calendarView === "week") {
    return startOfWeek(today)
  }

  return startOfMonth(today)
}

function normalizeDateForView(value: Date, calendarView: CalendarView) {
  if (calendarView === "week") {
    return startOfWeek(value)
  }

  return startOfMonth(value)
}

function getVisibleDateTitle(value: Date, calendarView: CalendarView) {
  if (calendarView === "week") {
    const start = startOfWeek(value)
    const end = addDays(start, 6)

    return `${shortDateFormatter.format(start)} - ${dateFormatter.format(end)}`
  }

  return monthFormatter.format(value)
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()
}

function isToday(value: Date) {
  const today = new Date()
  return (
    value.getFullYear() === today.getFullYear() &&
    value.getMonth() === today.getMonth() &&
    value.getDate() === today.getDate()
  )
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

function formatDateRange(booking: BookingDto) {
  return `${formatDate(booking.startDate)} to ${formatDate(booking.endDate)}`
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

function getEventClassName(status: BookingStatus) {
  if (status === "Confirmed") {
    return "border-primary/20 bg-primary/10 text-primary"
  }

  if (status === "Cancelled") {
    return "border-muted bg-muted/60 text-muted-foreground"
  }

  return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
}
