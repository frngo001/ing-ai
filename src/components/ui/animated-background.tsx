"use client";

import { cn } from "@/lib/utils";

interface AnimatedBackgroundProps {
    className?: string;
    variant?: "hero" | "subtle" | "mesh";
}

export function AnimatedBackground({ className, variant = "hero" }: AnimatedBackgroundProps) {
    if (variant === "mesh") {
        return (
            <div className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
                {/* Mesh gradient background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(62,207,142,0.3),transparent)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_80%_50%,rgba(20,184,166,0.15),transparent)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_20%_80%,rgba(16,185,129,0.1),transparent)]" />
            </div>
        );
    }

    if (variant === "subtle") {
        return (
            <div className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
            </div>
        );
    }

    return (
        <div className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
            {/* Primary animated blob - Supabase Green */}
            <div
                className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[1200px] h-[600px] rounded-full opacity-60 blur-[120px] animate-blob-pulse"
                style={{
                    background: "linear-gradient(135deg, rgba(62, 207, 142, 0.4) 0%, rgba(20, 184, 166, 0.3) 50%, rgba(16, 185, 129, 0.2) 100%)",
                }}
            />

            {/* Secondary floating blob - left */}
            <div
                className="absolute top-[10%] left-[15%] w-[600px] h-[600px] rounded-full opacity-40 blur-[100px] animate-float-slow"
                style={{
                    background: "radial-gradient(circle, rgba(62, 207, 142, 0.5) 0%, transparent 70%)",
                }}
            />

            {/* Tertiary floating blob - right */}
            <div
                className="absolute top-[20%] right-[10%] w-[500px] h-[500px] rounded-full opacity-30 blur-[80px] animate-float-delayed"
                style={{
                    background: "radial-gradient(circle, rgba(20, 184, 166, 0.4) 0%, transparent 70%)",
                }}
            />

            {/* Subtle grid overlay */}
            <div
                className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)`,
                    backgroundSize: "60px 60px",
                }}
            />

            {/* Noise texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />
        </div>
    );
}
