"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CalendarClock,
  Car,
  CircleAlert,
  CircleDollarSign,
  Gauge,
  TrendingUp,
  Users,
} from "lucide-react"

import { getDashboardSummary } from "@/lib/api-client"
import type { BookingDto, DashboardSummary } from "@/lib/api-types"
import { AdminShell } from "@/components/dashboard/admin-shell"
import { Badge } from "@/components/ui/badge"
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

type DashboardState =
  | { status: "loading"; data?: undefined; error?: undefined }
  | { status: "success"; data: DashboardSummary; error?: undefined }
  | { status: "error"; data?: undefined; error: string }

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
})

export function DashboardPage() {
  const [state, setState] = useState<DashboardState>({ status: "loading" })

  useEffect(() => {
    let ignore = false

    getDashboardSummary()
      .then((data) => {
        if (!ignore) {
          setState({ status: "success", data })
        }
      })
      .catch((error) => {
        if (!ignore) {
          setState({
            status: "error",
            error: error instanceof Error ? error.message : "Unable to load dashboard data.",
          })
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  return (
    <AdminShell>
      <section className="space-y-1 pt-2">
        <p className="text-sm text-muted-foreground">Dashboard</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Rental overview
        </h1>
      </section>
      <DashboardContent state={state} />
    </AdminShell>
  )
}

function DashboardContent({ state }: { state: DashboardState }) {
  if (state.status === "loading") {
    return <DashboardSkeleton />
  }

  if (state.status === "error") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dashboard data is unavailable</CardTitle>
          <CardDescription>
            We could not load today&apos;s rental overview. Try refreshing in a moment.
          </CardDescription>
          <CardAction>
            <CircleAlert className="size-4 text-muted-foreground" aria-hidden="true" />
          </CardAction>
        </CardHeader>
      </Card>
    )
  }

  return <DashboardSuccess data={state.data} />
}

function DashboardSuccess({ data }: { data: DashboardSummary }) {
  const analytics = useMemo(() => {
    const activeCars = data.cars.filter((car) => car.status === "Active").length
    const unavailableCars = data.cars.length - activeCars
    const renters = data.users.filter((user) => user.role === "Renter").length
    const pendingBookings = data.bookings.filter((booking) => booking.status === "Pending").length
    const confirmedBookings = data.bookings.filter((booking) => booking.status === "Confirmed").length
    const cancelledBookings = data.bookings.filter((booking) => booking.status === "Cancelled").length
    const estimatedValue = data.bookings.reduce(
      (total, booking) => total + booking.totalPrice,
      0
    )

    return {
      activeCars,
      unavailableCars,
      renters,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      estimatedValue,
      statCards: [
        {
          label: "Fleet size",
          value: data.cars.length,
          helper: `${activeCars} active cars`,
          icon: Car,
        },
        {
          label: "Customers",
          value: renters,
          helper: `${data.users.length} total users`,
          icon: Users,
        },
        {
          label: "Bookings",
          value: data.bookings.length,
          helper: `${pendingBookings} pending review`,
          icon: CalendarClock,
        },
        {
          label: "Booking value",
          value: currencyFormatter.format(estimatedValue),
          helper: `${confirmedBookings} confirmed bookings`,
          icon: CircleDollarSign,
        },
      ],
    }
  }, [data])

  const recentBookings = [...data.bookings]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 5)

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {analytics.statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle>{stat.label}</CardTitle>
              <CardDescription>{stat.helper}</CardDescription>
              <CardAction>
                <stat.icon className="size-4 text-muted-foreground" aria-hidden="true" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="font-heading text-3xl font-semibold tracking-tight">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Operations summary</CardTitle>
            <CardDescription>Current fleet and booking distribution.</CardDescription>
            <CardAction>
              <TrendingUp className="size-4 text-muted-foreground" aria-hidden="true" />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            <SummaryRow label="Active fleet" value={analytics.activeCars} />
            <SummaryRow label="Unavailable cars" value={analytics.unavailableCars} />
            <SummaryRow label="Pending bookings" value={analytics.pendingBookings} />
            <SummaryRow label="Confirmed bookings" value={analytics.confirmedBookings} />
            <SummaryRow label="Cancelled bookings" value={analytics.cancelledBookings} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent booking activity</CardTitle>
            <CardDescription>
              Latest rental activity from the booking records.
            </CardDescription>
            <CardAction>
              <Badge variant="outline">{recentBookings.length} recent</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {recentBookings.length > 0 ? (
              <BookingsTable bookings={recentBookings} />
            ) : (
              <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed p-6 text-center">
                <div className="max-w-sm">
                  <Gauge className="mx-auto mb-3 size-5 text-muted-foreground" aria-hidden="true" />
                  <p className="font-medium">No bookings yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Booking activity will appear here once records are created.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  )
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-heading text-lg font-semibold tabular-nums">{value}</span>
    </div>
  )
}

function BookingsTable({ bookings }: { bookings: BookingDto[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Booking</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="font-medium">{booking.id}</TableCell>
            <TableCell>{formatRenterName(booking)}</TableCell>
            <TableCell>{formatVehicleName(booking)}</TableCell>
            <TableCell>
              <Badge variant={getBookingStatusBadgeVariant(booking.status)}>{booking.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
              {currencyFormatter.format(booking.totalPrice)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["Fleet size", "Customers", "Bookings", "Booking value"].map((label) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
              <CardDescription>Loading analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-20" />
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Operations summary</CardTitle>
            <CardDescription>Loading distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-4/5" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent booking activity</CardTitle>
            <CardDescription>Loading booking preview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </CardContent>
        </Card>
      </section>
    </>
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

function getBookingStatusBadgeVariant(status: BookingDto["status"]) {
  if (status === "Confirmed") {
    return "secondary"
  }

  if (status === "Cancelled") {
    return "ghost"
  }

  return "outline"
}
