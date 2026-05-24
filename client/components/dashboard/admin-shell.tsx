"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, CalendarClock, Car, LayoutDashboard, Users } from "lucide-react"

import { AdminNavbar } from "@/components/dashboard/admin-navbar"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

const navItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Cars", href: "/cars", icon: Car },
  { title: "Bookings", href: "/bookings", icon: CalendarClock },
  { title: "Customers", href: "/users", icon: Users },
  { title: "Calendar", href: "/calendar", icon: CalendarDays },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
            <div className="flex min-w-0 items-center gap-2">
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <div className="truncate text-xl font-bold">RentCar</div>
                <div className="truncate text-xs text-sidebar-foreground/60">
                  Admin workspace
                </div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon aria-hidden="true" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <main className="min-h-[100dvh] bg-muted/20">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-6 sm:px-6 lg:px-8">
              <AdminNavbar />
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
