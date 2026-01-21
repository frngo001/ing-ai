"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

// =============================================================================
// MOCKUP FRAME - Premium Glassmorphism Container
// =============================================================================

const mockupFrameVariants = cva(
    "relative mx-auto overflow-visible rounded-2xl",
    {
        variants: {
            size: {
                small: "max-w-[800px]",
                medium: "max-w-[1000px]",
                large: "max-w-[1200px]",
                full: "w-full",
            },
            variant: {
                default: "",
                glass: "",
                floating: "",
            },
        },
        defaultVariants: {
            size: "medium",
            variant: "default",
        },
    }
);

interface MockupFrameProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof mockupFrameVariants> { }

export function MockupFrame({
    className,
    size,
    variant,
    children,
    ...props
}: MockupFrameProps) {
    return (
        <div
            className={cn(mockupFrameVariants({ size, variant }), className)}
            {...props}
        >
            {/* Multi-layer glow effects */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/30 via-emerald-500/20 to-teal-500/30 blur-3xl opacity-60 animate-glow-pulse" />
            <div
                className="absolute -inset-8 rounded-3xl bg-gradient-to-tr from-cyan-400/20 via-primary/15 to-emerald-400/20 blur-[60px] opacity-40 animate-glow-pulse"
                style={{ animationDelay: "1.5s" }}
            />

            {/* Main content container with glassmorphism */}
            <div className="relative">
                {children}
            </div>
        </div>
    );
}

// =============================================================================
// MOCKUP - Browser Window Style Container
// =============================================================================

interface MockupProps extends React.HTMLAttributes<HTMLDivElement> {
    type?: "responsive" | "mobile" | "desktop" | "browser";
}

export function Mockup({
    className,
    children,
    type = "responsive",
    ...props
}: MockupProps) {
    if (type === "browser") {
        return (
            <div
                className={cn(
                    "relative overflow-hidden rounded-2xl",
                    "bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d]",
                    "border border-white/[0.08]",
                    "shadow-2xl shadow-black/40",
                    className
                )}
                {...props}
            >
                {/* Browser chrome with traffic lights */}
                <div className="relative flex items-center gap-2 px-4 py-3 bg-gradient-to-b from-[#2a2a2a] to-[#1f1f1f] border-b border-white/[0.06]">
                    {/* Traffic lights */}
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-lg shadow-red-500/30" />
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-lg shadow-yellow-500/30" />
                        <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-lg shadow-green-500/30" />
                    </div>

                    {/* URL bar */}
                    <div className="flex-1 flex justify-center">
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-black/40 rounded-lg border border-white/[0.06] min-w-[300px] max-w-[400px]">
                            <svg
                                className="w-3.5 h-3.5 text-emerald-500/80"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                            <span className="text-xs text-white/50 font-medium">
                                {process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") || "ingai-editor.xyz/editor"}
                            </span>
                        </div>
                    </div>

                    {/* Window controls placeholder */}
                    <div className="w-[68px]" />
                </div>

                {/* Content area */}
                <div className="relative">{children}</div>
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden", className)} {...props}>
            {children}
        </div>
    );
}

// =============================================================================
// FLOATING FEATURE CARD - Premium Glassmorphism Card
// =============================================================================

interface FloatingCardProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: React.ReactNode;
    title: string;
    delay?: string;
    position?: "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export function FloatingCard({
    icon,
    title,
    delay = "0s",
    position = "right",
    className,
    ...props
}: FloatingCardProps) {
    const positionClasses = {
        left: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
        right: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
        "top-left": "-left-4 -top-4 md:-left-12 md:-top-8",
        "top-right": "-right-4 -top-4 md:-right-12 md:-top-8",
        "bottom-left": "-left-4 -bottom-4 md:-left-16 md:-bottom-12",
        "bottom-right": "-right-4 -bottom-4 md:-right-16 md:-bottom-12",
    };

    return (
        <div
            className={cn(
                "absolute z-20 hidden md:flex",
                "items-center gap-3 px-4 py-3",
                "bg-white/10 dark:bg-black/30",
                "backdrop-blur-xl",
                "rounded-xl",
                "border border-white/20 dark:border-white/[0.08]",
                "shadow-xl shadow-black/10 dark:shadow-black/40",
                "animate-float-slow",
                positionClasses[position],
                className
            )}
            style={{ animationDelay: delay }}
            {...props}
        >
            {icon && (
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-500/20 text-primary">
                    {icon}
                </div>
            )}
            <span className="text-sm font-medium text-foreground/90 whitespace-nowrap">
                {title}
            </span>
        </div>
    );
}

// =============================================================================
// PERSPECTIVE WRAPPER - 3D Transform Container
// =============================================================================

interface PerspectiveWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
    intensity?: "subtle" | "medium" | "strong";
}

export function PerspectiveWrapper({
    children,
    intensity = "medium",
    className,
    ...props
}: PerspectiveWrapperProps) {
    const intensityStyles = {
        subtle: "rotateX(2deg) rotateY(-1deg)",
        medium: "rotateX(4deg) rotateY(-2deg)",
        strong: "rotateX(8deg) rotateY(-4deg)",
    };

    return (
        <div
            className={cn("relative", className)}
            style={{
                perspective: "2000px",
                perspectiveOrigin: "center 30%",
            }}
            {...props}
        >
            <div
                className="relative transform-gpu transition-transform duration-700 hover:scale-[1.02]"
                style={{
                    transform: intensityStyles[intensity],
                    transformStyle: "preserve-3d",
                }}
            >
                {children}
            </div>
        </div>
    );
}
