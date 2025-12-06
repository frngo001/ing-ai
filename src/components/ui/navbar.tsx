import * as React from "react"
import { cn } from "@/lib/utils"

const Navbar = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "flex h-16 items-center justify-between py-4",
            className
        )}
        {...props}
    />
))
Navbar.displayName = "Navbar"

const NavbarLeft = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center gap-6 md:gap-10", className)}
        {...props}
    />
))
NavbarLeft.displayName = "NavbarLeft"

const NavbarRight = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center gap-4", className)}
        {...props}
    />
))
NavbarRight.displayName = "NavbarRight"

export { Navbar, NavbarLeft, NavbarRight }
