"use client"

import type { UserDto } from "@/lib/api-types"
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

type DeleteUserDialogProps = {
  user: UserDto | null
  deleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function DeleteUserDialog({
  user,
  deleting,
  onOpenChange,
  onConfirm,
}: DeleteUserDialogProps) {
  return (
    <AlertDialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete customer record?</AlertDialogTitle>
          <AlertDialogDescription>
            {user
              ? `${formatUserName(user)} will be removed from customer records.`
              : "This customer will be removed from customer records."}
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
            {deleting ? "Deleting" : "Delete customer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function formatUserName(user: UserDto) {
  return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ")
}
