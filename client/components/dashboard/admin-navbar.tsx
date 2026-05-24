"use client"

import { Search } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function AdminNavbar() {
  return (
    <header className="sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="md:hidden" />

        <div className="ml-auto hidden w-full max-w-sm items-center md:flex">
          <div className="relative w-full">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              disabled
              aria-label="Search coming soon"
              placeholder="Search coming soon"
              className="pl-8"
            />
          </div>
        </div>

        <ThemeToggle />
      </div>
    </header>
  )
}
