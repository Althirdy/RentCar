"use client"

import type { CarDto } from "@/lib/api-types"
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

type DeleteCarDialogProps = {
  car: CarDto | null
  deleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function DeleteCarDialog({
  car,
  deleting,
  onOpenChange,
  onConfirm,
}: DeleteCarDialogProps) {
  return (
    <AlertDialog open={Boolean(car)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete car?</AlertDialogTitle>
          <AlertDialogDescription>
            {car
              ? `${car.maker} ${car.model} will be removed from the fleet if it has no bookings.`
              : "This car will be removed from the fleet."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={(event) => {
              event.preventDefault()
              void onConfirm()
            }}
          >
            {deleting ? "Deleting" : "Delete car"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
