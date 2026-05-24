"use client"

import type { BookingDto, BookingStatus } from "@/lib/api-types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type BookingStatusAction = {
  booking: BookingDto
  status: Exclude<BookingStatus, "Pending">
} | null

type BookingStatusDialogProps = {
  action: BookingStatusAction
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function BookingStatusDialog({
  action,
  submitting,
  onOpenChange,
  onConfirm,
}: BookingStatusDialogProps) {
  const isCancellation = action?.status === "Cancelled"
  const actionLabel = isCancellation ? "Cancel booking" : "Confirm booking"

  return (
    <AlertDialog open={Boolean(action)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{actionLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            {action
              ? getDescription(action.booking, action.status)
              : "This booking status will be updated."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Keep booking</AlertDialogCancel>
          <AlertDialogAction
            variant={isCancellation ? "destructive" : "default"}
            disabled={submitting}
            onClick={(event) => {
              event.preventDefault()
              void onConfirm()
            }}
          >
            {submitting ? "Updating" : actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function getDescription(booking: BookingDto, status: Exclude<BookingStatus, "Pending">) {
  const customerName = [
    booking.renter.firstName,
    booking.renter.middleName,
    booking.renter.lastName,
  ]
    .filter(Boolean)
    .join(" ")
  const vehicleName = `${booking.car.year} ${booking.car.maker} ${booking.car.model}`

  if (status === "Confirmed") {
    return `${customerName}'s booking for the ${vehicleName} will be marked as confirmed.`
  }

  return `${customerName}'s booking for the ${vehicleName} will be cancelled. This keeps the booking record for rental history.`
}
