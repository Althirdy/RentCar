"use client"

import { useEffect, useMemo, useState } from "react"
import { Car, CircleAlert, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { AdminShell } from "@/components/dashboard/admin-shell"
import { createCar, deleteCar, getCars, updateCar } from "@/lib/api-client"
import type { CarDto, CreateCarRequest } from "@/lib/api-types"
import { CarFormDialog } from "@/components/cars/car-form-dialog"
import { DeleteCarDialog } from "@/components/cars/delete-car-dialog"
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

type CarsState =
  | { status: "loading"; cars?: undefined; error?: undefined }
  | { status: "success"; cars: CarDto[]; error?: undefined }
  | { status: "error"; cars?: undefined; error: string }

const emptyCars: CarDto[] = []

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
})

export function CarsPage() {
  const [state, setState] = useState<CarsState>({ status: "loading" })
  const [formOpen, setFormOpen] = useState(false)
  const [editingCar, setEditingCar] = useState<CarDto | null>(null)
  const [deletingCar, setDeletingCar] = useState<CarDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formKey, setFormKey] = useState(0)

  async function loadCars() {
    setState({ status: "loading" })

    try {
      const cars = await getCars()
      setState({ status: "success", cars })
    } catch (error) {
      setState({
        status: "error",
        error: error instanceof Error ? error.message : "Unable to load cars.",
      })
    }
  }

  useEffect(() => {
    let ignore = false

    getCars()
      .then((cars) => {
        if (!ignore) {
          setState({ status: "success", cars })
        }
      })
      .catch((error) => {
        if (!ignore) {
          setState({
            status: "error",
            error: error instanceof Error ? error.message : "Unable to load cars.",
          })
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  const cars = state.status === "success" ? state.cars : emptyCars
  const activeCars = useMemo(
    () => cars.filter((car) => car.status === "Active").length,
    [cars]
  )

  function openCreateDialog() {
    setEditingCar(null)
    setFormError(null)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  function openEditDialog(car: CarDto) {
    setEditingCar(car)
    setFormError(null)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  async function handleSubmit(request: CreateCarRequest) {
    setSubmitting(true)
    setFormError(null)

    try {
      if (editingCar) {
        await updateCar(editingCar.id, request)
        toast.success("Car updated")
      } else {
        await createCar(request)
        toast.success("Car created")
      }

      setFormOpen(false)
      setEditingCar(null)
      await loadCars()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save car.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deletingCar) {
      return
    }

    setDeleting(true)

    try {
      await deleteCar(deletingCar.id)
      toast.success("Car deleted")
      setDeletingCar(null)
      await loadCars()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete car.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminShell>
      <section className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Fleet management</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Cars
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Manage rental inventory, pricing, availability, and vehicle details.
          </p>
        </div>
        <Button className="w-full active:scale-[0.98] sm:w-auto" onClick={openCreateDialog}>
          <Plus className="size-4" aria-hidden="true" />
          Add car
        </Button>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Fleet inventory</CardTitle>
          <CardDescription>
            {state.status === "success"
              ? `${cars.length} total vehicles, ${activeCars} active`
              : "Review and maintain the current fleet."}
          </CardDescription>
          <CardAction>
            <Badge variant="outline">{activeCars} active</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <CarsContent
            state={state}
            onRetry={() => void loadCars()}
            onCreate={openCreateDialog}
            onEdit={openEditDialog}
            onDelete={setDeletingCar}
          />
        </CardContent>
      </Card>

      <CarFormDialog
        key={formKey}
        open={formOpen}
        car={editingCar}
        submitting={submitting}
        apiError={formError}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingCar(null)
            setFormError(null)
          }
        }}
        onSubmit={handleSubmit}
      />
      <DeleteCarDialog
        car={deletingCar}
        deleting={deleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCar(null)
          }
        }}
        onConfirm={handleDelete}
      />
    </AdminShell>
  )
}

function CarsContent({
  state,
  onRetry,
  onCreate,
  onEdit,
  onDelete,
}: {
  state: CarsState
  onRetry: () => void
  onCreate: () => void
  onEdit: (car: CarDto) => void
  onDelete: (car: CarDto) => void
}) {
  if (state.status === "loading") {
    return <CarsTableSkeleton />
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed p-6 text-center">
        <div className="max-w-sm">
          <CircleAlert className="mx-auto mb-3 size-5 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">Cars are unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">{state.error}</p>
          <Button variant="outline" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (state.cars.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed p-6 text-center">
        <div className="max-w-sm">
          <Car className="mx-auto mb-3 size-5 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">No cars yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the first vehicle to start building the rental fleet.
          </p>
          <Button className="mt-4" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add car
          </Button>
        </div>
      </div>
    )
  }

  return <CarsTable cars={state.cars} onEdit={onEdit} onDelete={onDelete} />
}

function CarsTable({
  cars,
  onEdit,
  onDelete,
}: {
  cars: CarDto[]
  onEdit: (car: CarDto) => void
  onDelete: (car: CarDto) => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Car</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Fuel</TableHead>
          <TableHead>Transmission</TableHead>
          <TableHead>Seats</TableHead>
          <TableHead className="text-right">Price per day</TableHead>
          <TableHead className="w-32 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cars.map((car) => (
          <TableRow key={car.id}>
            <TableCell>
              <div className="font-medium">
                {car.maker} {car.model}
              </div>
              <div className="text-sm text-muted-foreground">{car.year}</div>
            </TableCell>
            <TableCell>
              <Badge variant={getCarStatusBadgeVariant(car.status)}>
                {formatEnumLabel(car.status)}
              </Badge>
            </TableCell>
            <TableCell>{car.fuelType}</TableCell>
            <TableCell>{car.transmissionType}</TableCell>
            <TableCell>{car.seats}</TableCell>
            <TableCell className="text-right">
              {currencyFormatter.format(car.pricePerDay)}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="icon-sm" onClick={() => onEdit(car)}>
                  <Pencil className="size-4" aria-hidden="true" />
                  <span className="sr-only">Edit car</span>
                </Button>
                <Button variant="destructive" size="icon-sm" onClick={() => onDelete(car)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  <span className="sr-only">Delete car</span>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function CarsTableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-4/5" />
    </div>
  )
}

function formatEnumLabel(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2")
}

function getCarStatusBadgeVariant(status: CarDto["status"]) {
  if (status === "Active") {
    return "secondary"
  }

  if (status === "Retired") {
    return "ghost"
  }

  return "outline"
}
