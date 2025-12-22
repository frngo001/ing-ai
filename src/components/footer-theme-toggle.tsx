"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useMounted } from "@/hooks/use-mounted"

export function FooterThemeToggle() {
    const { theme, setTheme } = useTheme()
    const mounted = useMounted()

    const toggleTheme = React.useCallback(() => {
        if (theme === "light") {
            setTheme("dark")
        } else if (theme === "dark") {
            setTheme("light")
        } else {
            // Wenn system, wechsle zu dark
            setTheme("dark")
        }
    }, [theme, setTheme])

    if (!mounted) {
        return (
            <Button 
                variant="outline" 
                size="icon" 
                disabled
                className="relative z-50 pointer-events-auto"
            >
                <Sun className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Theme wechseln</span>
            </Button>
        )
    }

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="relative z-50 pointer-events-auto cursor-pointer"
            aria-label="Theme wechseln"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Theme wechseln</span>
        </Button>
    )
}

