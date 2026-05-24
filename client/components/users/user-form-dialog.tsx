"use client"

import { FormEvent, useMemo, useState } from "react"

import type { CreateUserRequest, UserDto } from "@/lib/api-types"
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

type UserFormState = {
  email: string
  contactNumber: string
  firstName: string
  middleName: string
  lastName: string
  password: string
}

type UserFormDialogProps = {
  open: boolean
  user?: UserDto | null
  submitting: boolean
  apiError?: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (request: CreateUserRequest) => Promise<void>
}

const emptyForm: UserFormState = {
  email: "",
  contactNumber: "",
  firstName: "",
  middleName: "",
  lastName: "",
  password: "",
}

export function UserFormDialog({
  open,
  user,
  submitting,
  apiError,
  onOpenChange,
  onSubmit,
}: UserFormDialogProps) {
  const [form, setForm] = useState<UserFormState>(
    user
      ? {
          email: user.email,
          contactNumber: user.contactNumber,
          firstName: user.firstName,
          middleName: user.middleName,
          lastName: user.lastName,
          password: "",
        }
      : emptyForm
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  const mode = user ? "edit" : "create"
  const title = mode === "create" ? "Add customer" : "Edit customer"
  const description =
    mode === "create"
      ? "Create a renter account for customer management."
      : "Update customer contact and account details."
  const displayError = validationError ?? apiError
  const canSubmit = useMemo(() => !submitting, [submitting])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const request = toRequest(form, mode)
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
            <Field label="First name" htmlFor="firstName">
              <Input
                id="firstName"
                value={form.firstName}
                maxLength={50}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
              />
            </Field>
            <Field label="Last name" htmlFor="lastName">
              <Input
                id="lastName"
                value={form.lastName}
                maxLength={50}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
              />
            </Field>
            <Field label="Middle name" htmlFor="middleName">
              <Input
                id="middleName"
                value={form.middleName}
                maxLength={50}
                onChange={(event) => setForm({ ...form, middleName: event.target.value })}
              />
            </Field>
            <Field label="Contact number" htmlFor="contactNumber">
              <Input
                id="contactNumber"
                value={form.contactNumber}
                maxLength={15}
                onChange={(event) => setForm({ ...form, contactNumber: event.target.value })}
              />
            </Field>
          </div>

          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              value={form.email}
              maxLength={100}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </Field>

          <Field label={mode === "create" ? "Password" : "New password"} htmlFor="password">
            <Input
              id="password"
              type="password"
              value={form.password}
              maxLength={100}
              placeholder={mode === "edit" ? "Leave blank to keep current password" : undefined}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
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
              {submitting ? "Saving" : mode === "create" ? "Create customer" : "Save changes"}
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

function toRequest(form: UserFormState, mode: "create" | "edit"): CreateUserRequest | string {
  const email = form.email.trim()
  const contactNumber = form.contactNumber.trim()
  const firstName = form.firstName.trim()
  const middleName = form.middleName.trim()
  const lastName = form.lastName.trim()
  const password = form.password.trim()

  if (!firstName || !lastName || !email) {
    return "First name, last name, and email are required."
  }

  if (firstName.length > 50 || middleName.length > 50 || lastName.length > 50) {
    return "Names must be 50 characters or fewer."
  }

  if (contactNumber.length > 15) {
    return "Contact number must be 15 characters or fewer."
  }

  if (email.length > 100 || !email.includes("@")) {
    return "Enter a valid email address."
  }

  if (mode === "create" && password.length < 6) {
    return "Password must be at least 6 characters."
  }

  if (password && password.length < 6) {
    return "New password must be at least 6 characters."
  }

  return {
    email,
    contactNumber,
    firstName,
    middleName,
    lastName,
    password,
  }
}
