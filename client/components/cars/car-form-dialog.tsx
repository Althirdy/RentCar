"use client"

import { FormEvent, useMemo, useState } from "react"

import type {
  CarDto,
  CarStatus,
  CreateCarRequest,
  FuelType,
  TransmissionType,
} from "@/lib/api-types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const carStatuses: CarStatus[] = ["Active", "Rented", "UnderMaintenance", "Retired"]
const fuelTypes: FuelType[] = ["Diesel", "Gasoline", "Electric"]
const transmissionTypes: TransmissionType[] = ["Automatic", "Manual"]

type CarFormState = {
  maker: string
  model: string
  year: string
  imageUrl: string
  pricePerDay: string
  status: CarStatus
  fuelType: FuelType
  transmissionType: TransmissionType
  seats: string
}

type CarFormDialogProps = {
  open: boolean
  car?: CarDto | null
  submitting: boolean
  apiError?: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (request: CreateCarRequest) => Promise<void>
}

const emptyForm: CarFormState = {
  maker: "",
  model: "",
  year: new Date().getFullYear().toString(),
  imageUrl: "",
  pricePerDay: "",
  status: "Active",
  fuelType: "Gasoline",
  transmissionType: "Automatic",
  seats: "5",
}

export function CarFormDialog({
  open,
  car,
  submitting,
  apiError,
  onOpenChange,
  onSubmit,
}: CarFormDialogProps) {
  const [form, setForm] = useState<CarFormState>(
    car
      ? {
          maker: car.maker,
          model: car.model,
          year: car.year.toString(),
          imageUrl: car.imageUrl,
          pricePerDay: car.pricePerDay.toString(),
          status: car.status,
          fuelType: car.fuelType,
          transmissionType: car.transmissionType,
          seats: car.seats.toString(),
        }
      : emptyForm
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  const mode = car ? "edit" : "create"

  const title = mode === "create" ? "Add car" : "Edit car"
  const description =
    mode === "create"
      ? "Create a new vehicle record for the rental fleet."
      : "Update inventory details for this vehicle."

  const displayError = validationError ?? apiError

  const canSubmit = useMemo(() => !submitting, [submitting])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const request = toRequest(form)
    if (typeof request === "string") {
      setValidationError(request)
      return
    }

    setValidationError(null)
    await onSubmit(request)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Maker" htmlFor="maker">
              <Input
                id="maker"
                value={form.maker}
                maxLength={50}
                onChange={(event) => setForm({ ...form, maker: event.target.value })}
              />
            </Field>
            <Field label="Model" htmlFor="model">
              <Input
                id="model"
                value={form.model}
                maxLength={50}
                onChange={(event) => setForm({ ...form, model: event.target.value })}
              />
            </Field>
            <Field label="Year" htmlFor="year">
              <Input
                id="year"
                inputMode="numeric"
                value={form.year}
                onChange={(event) => setForm({ ...form, year: event.target.value })}
              />
            </Field>
            <Field label="Price per day" htmlFor="pricePerDay">
              <Input
                id="pricePerDay"
                inputMode="decimal"
                value={form.pricePerDay}
                onChange={(event) => setForm({ ...form, pricePerDay: event.target.value })}
              />
            </Field>
            <Field label="Status" htmlFor="status">
              <Select
                value={form.status}
                onValueChange={(value) => setForm({ ...form, status: value as CarStatus })}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
                  {carStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatEnumLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Fuel type" htmlFor="fuelType">
              <Select
                value={form.fuelType}
                onValueChange={(value) => setForm({ ...form, fuelType: value as FuelType })}
              >
                <SelectTrigger id="fuelType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
                  {fuelTypes.map((fuelType) => (
                    <SelectItem key={fuelType} value={fuelType}>
                      {fuelType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Transmission" htmlFor="transmissionType">
              <Select
                value={form.transmissionType}
                onValueChange={(value) =>
                  setForm({ ...form, transmissionType: value as TransmissionType })
                }
              >
                <SelectTrigger id="transmissionType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
                  {transmissionTypes.map((transmissionType) => (
                    <SelectItem key={transmissionType} value={transmissionType}>
                      {transmissionType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Seats" htmlFor="seats">
              <Input
                id="seats"
                inputMode="numeric"
                value={form.seats}
                onChange={(event) => setForm({ ...form, seats: event.target.value })}
              />
            </Field>
          </div>

          <Field label="Image URL" htmlFor="imageUrl">
            <Textarea
              id="imageUrl"
              value={form.imageUrl}
              maxLength={500}
              rows={3}
              onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
            />
          </Field>

          {displayError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {displayError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? "Saving" : mode === "create" ? "Create car" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

function toRequest(form: CarFormState): CreateCarRequest | string {
  const maker = form.maker.trim()
  const model = form.model.trim()
  const imageUrl = form.imageUrl.trim()
  const year = Number(form.year)
  const pricePerDay = Number(form.pricePerDay)
  const seats = Number(form.seats)

  if (!maker || !model) {
    return "Maker and model are required."
  }

  if (maker.length > 50 || model.length > 50) {
    return "Maker and model must be 50 characters or fewer."
  }

  if (!Number.isInteger(year) || year < 1886 || year > 3000) {
    return "Year must be between 1886 and 3000."
  }

  if (imageUrl.length > 500) {
    return "Image URL must be 500 characters or fewer."
  }

  if (!Number.isFinite(pricePerDay) || pricePerDay <= 0) {
    return "Price per day must be greater than 0."
  }

  if (!Number.isInteger(seats) || seats < 1 || seats > 100) {
    return "Seats must be between 1 and 100."
  }

  return {
    maker,
    model,
    year,
    imageUrl,
    pricePerDay,
    status: form.status,
    fuelType: form.fuelType,
    transmissionType: form.transmissionType,
    seats,
  }
}

function formatEnumLabel(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2")
}
