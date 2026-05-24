"use client"

import { useEffect, useMemo, useState } from "react"
import { CircleAlert, Pencil, Plus, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import { AdminShell } from "@/components/dashboard/admin-shell"
import { DeleteUserDialog } from "@/components/users/delete-user-dialog"
import { UserFormDialog } from "@/components/users/user-form-dialog"
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
import { createUser, deleteUser, getUsers, updateUser } from "@/lib/api-client"
import type { CreateUserRequest, UserDto } from "@/lib/api-types"

type UsersState =
  | { status: "loading"; users?: undefined; error?: undefined }
  | { status: "success"; users: UserDto[]; error?: undefined }
  | { status: "error"; users?: undefined; error: string }

const emptyUsers: UserDto[] = []

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

export function UsersPage() {
  const [state, setState] = useState<UsersState>({ status: "loading" })
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserDto | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formKey, setFormKey] = useState(0)

  async function loadUsers() {
    setState({ status: "loading" })

    try {
      const users = await getUsers()
      setState({ status: "success", users })
    } catch (error) {
      setState({
        status: "error",
        error: error instanceof Error ? error.message : "Unable to load users.",
      })
    }
  }

  useEffect(() => {
    let ignore = false

    getUsers()
      .then((users) => {
        if (!ignore) {
          setState({ status: "success", users })
        }
      })
      .catch((error) => {
        if (!ignore) {
          setState({
            status: "error",
            error: error instanceof Error ? error.message : "Unable to load users.",
          })
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  const users = state.status === "success" ? state.users : emptyUsers
  const renterCount = useMemo(
    () => users.filter((user) => user.role === "Renter").length,
    [users]
  )

  function openCreateDialog() {
    setEditingUser(null)
    setFormError(null)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  function openEditDialog(user: UserDto) {
    setEditingUser(user)
    setFormError(null)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  async function handleSubmit(request: CreateUserRequest) {
    setSubmitting(true)
    setFormError(null)

    try {
      if (editingUser) {
        await updateUser(editingUser.id, request)
        toast.success("User updated")
      } else {
        await createUser(request)
        toast.success("User created")
      }

      setFormOpen(false)
      setEditingUser(null)
      await loadUsers()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save user.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deletingUser) {
      return
    }

    setDeleting(true)

    try {
      await deleteUser(deletingUser.id)
      toast.success("User deleted")
      setDeletingUser(null)
      await loadUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete customer.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminShell>
      <section className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Customer management</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Customers
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Manage customer accounts, contact details, and booking activity.
          </p>
        </div>
        <Button className="w-full active:scale-[0.98] sm:w-auto" onClick={openCreateDialog}>
          <Plus className="size-4" aria-hidden="true" />
          Add customer
        </Button>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Customer records</CardTitle>
          <CardDescription>
            {state.status === "success"
              ? `${users.length} total users, ${renterCount} renters`
              : "Review customer contact and booking activity."}
          </CardDescription>
          <CardAction>
            <Badge variant="outline">{renterCount} renters</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <UsersContent
            state={state}
            onRetry={() => void loadUsers()}
            onCreate={openCreateDialog}
            onEdit={openEditDialog}
            onDelete={setDeletingUser}
          />
        </CardContent>
      </Card>

      <UserFormDialog
        key={formKey}
        open={formOpen}
        user={editingUser}
        submitting={submitting}
        apiError={formError}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingUser(null)
            setFormError(null)
          }
        }}
        onSubmit={handleSubmit}
      />
      <DeleteUserDialog
        user={deletingUser}
        deleting={deleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingUser(null)
          }
        }}
        onConfirm={handleDelete}
      />
    </AdminShell>
  )
}

function UsersContent({
  state,
  onRetry,
  onCreate,
  onEdit,
  onDelete,
}: {
  state: UsersState
  onRetry: () => void
  onCreate: () => void
  onEdit: (user: UserDto) => void
  onDelete: (user: UserDto) => void
}) {
  if (state.status === "loading") {
    return <UsersTableSkeleton />
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed p-6 text-center">
        <div className="max-w-sm">
          <CircleAlert className="mx-auto mb-3 size-5 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">Customer records are unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">{state.error}</p>
          <Button variant="outline" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (state.users.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed p-6 text-center">
        <div className="max-w-sm">
          <Users className="mx-auto mb-3 size-5 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">No customers yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the first customer account to start managing renter records.
          </p>
          <Button className="mt-4" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add customer
          </Button>
        </div>
      </div>
    )
  }

  return <UsersTable users={state.users} onEdit={onEdit} onDelete={onDelete} />
}

function UsersTable({
  users,
  onEdit,
  onDelete,
}: {
  users: UserDto[]
  onEdit: (user: UserDto) => void
  onDelete: (user: UserDto) => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Bookings</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="w-32 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="font-medium">{formatUserName(user)}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </TableCell>
            <TableCell>{user.contactNumber || "No contact number"}</TableCell>
            <TableCell>
              <Badge variant={user.role === "Admin" ? "secondary" : "outline"}>
                {user.role}
              </Badge>
            </TableCell>
            <TableCell>{formatBookingActivity(user)}</TableCell>
            <TableCell>{formatDate(user.createdAt)}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="icon-sm" onClick={() => onEdit(user)}>
                  <Pencil className="size-4" aria-hidden="true" />
                  <span className="sr-only">Edit customer</span>
                </Button>
                {user.bookingCount > 0 ? (
                  <span className="self-center text-xs text-muted-foreground">
                    History kept
                  </span>
                ) : (
                  <Button variant="destructive" size="icon-sm" onClick={() => onDelete(user)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    <span className="sr-only">Delete customer</span>
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function UsersTableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-4/5" />
    </div>
  )
}

function formatUserName(user: UserDto) {
  return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ")
}

function formatBookingActivity(user: UserDto) {
  const bookingLabel = user.bookingCount === 1 ? "booking" : "bookings"

  if (user.pendingBookingCount > 0 || user.confirmedBookingCount > 0) {
    return `${user.bookingCount} ${bookingLabel}, ${user.pendingBookingCount} pending, ${user.confirmedBookingCount} confirmed`
  }

  return `${user.bookingCount} ${bookingLabel}`
}

function formatDate(value: string) {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? "Invalid date" : dateFormatter.format(timestamp)
}
