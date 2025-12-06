import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// =============================================================================
// GLOW COMPONENT - Premium Multi-Layered Glow Effects
// =============================================================================

const glowVariants = cva("absolute w-full pointer-events-none", {
    variants: {
        variant: {
            top: "top-0 left-0 right-0",
            above: "-top-[128px] left-0 right-0",
            bottom: "bottom-0 left-0 right-0",
            center: "top-[50%] left-0 right-0 -translate-y-1/2",
            ambient: "inset-0",
            radial: "inset-0",
        },
        intensity: {
            low: "",
            medium: "",
            high: "",
        },
    },
    defaultVariants: {
        variant: "top",
        intensity: "medium",
    },
});

interface GlowProps extends VariantProps<typeof glowVariants> {
    className?: string;
    animated?: boolean;
}

export default function Glow({
    variant,
    intensity = "medium",
    animated = true,
    className,
}: GlowProps) {
    const intensityOpacity = {
        low: 0.2,
        medium: 0.4,
        high: 0.6,
    };

    const baseOpacity = intensityOpacity[intensity || "medium"];

    if (variant === "ambient") {
        return (
            <div className={cn(glowVariants({ variant }), className)}>
                {/* Primary glow */}
                <div
                    className={cn("absolute inset-0", animated && "animate-glow-pulse")}
                    style={{
                        background:
                            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(62, 207, 142, 0.25), transparent 70%)",
                        opacity: baseOpacity,
                    }}
                />
                {/* Secondary glow */}
                <div
                    className={cn(
                        "absolute inset-0",
                        animated && "animate-glow-pulse animation-delay-2000"
                    )}
                    style={{
                        background:
                            "radial-gradient(ellipse 60% 40% at 30% 10%, rgba(20, 184, 166, 0.2), transparent 60%)",
                        opacity: baseOpacity * 0.8,
                    }}
                />
                {/* Tertiary glow */}
                <div
                    className={cn(
                        "absolute inset-0",
                        animated && "animate-glow-pulse animation-delay-4000"
                    )}
                    style={{
                        background:
                            "radial-gradient(ellipse 50% 35% at 70% 15%, rgba(6, 182, 212, 0.15), transparent 50%)",
                        opacity: baseOpacity * 0.6,
                    }}
                />
            </div>
        );
    }

    if (variant === "radial") {
        return (
            <div className={cn(glowVariants({ variant }), className)}>
                {/* Center radial gradient */}
                <div
                    className={cn("absolute inset-0", animated && "animate-glow-pulse")}
                    style={{
                        background:
                            "radial-gradient(circle at 50% 50%, rgba(62, 207, 142, 0.3), transparent 60%)",
                        opacity: baseOpacity,
                    }}
                />
            </div>
        );
    }

    // Default conic gradient glow
    return (
        <div
            className={cn(glowVariants({ variant }), animated && "animate-glow-pulse", className)}
            style={{
                background:
                    "conic-gradient(from 230.29deg at 51.63% 52.16%, rgb(16, 185, 129) 0deg, rgb(20, 184, 166) 67.5deg, rgb(6, 182, 212) 198.75deg, rgb(34, 197, 94) 251.25deg, rgb(16, 185, 129) 301.88deg, rgb(62, 207, 142) 360deg)",
                filter: "blur(100px)",
                height: "256px",
                opacity: baseOpacity,
            }}
        />
    );
}

// =============================================================================
// SPOTLIGHT EFFECT - Follows cursor or animates
// =============================================================================

interface SpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "md" | "lg" | "xl";
}

export function Spotlight({ size = "lg", className, ...props }: SpotlightProps) {
    const sizeStyles = {
        sm: "w-[300px] h-[300px]",
        md: "w-[500px] h-[500px]",
        lg: "w-[700px] h-[700px]",
        xl: "w-[1000px] h-[1000px]",
    };

    return (
        <div
            className={cn(
                "absolute pointer-events-none",
                "rounded-full",
                "bg-gradient-radial from-primary/30 via-primary/10 to-transparent",
                "blur-3xl",
                "animate-float-slow",
                sizeStyles[size],
                className
            )}
            {...props}
        />
    );
}

// =============================================================================
// GRADIENT BORDER - Animated gradient border effect
// =============================================================================

interface GradientBorderProps extends React.HTMLAttributes<HTMLDivElement> {
    gradientClassName?: string;
    borderWidth?: number;
}

export function GradientBorder({
    children,
    gradientClassName,
    borderWidth = 1,
    className,
    ...props
}: GradientBorderProps) {
    return (
        <div className={cn("relative rounded-2xl p-px", className)} {...props}>
            {/* Animated gradient background */}
            <div
                className={cn(
                    "absolute inset-0 rounded-2xl",
                    "bg-gradient-to-r from-primary via-emerald-500 to-teal-500",
                    "opacity-80",
                    gradientClassName
                )}
                style={{
                    padding: borderWidth,
                }}
            />
            {/* Content */}
            <div className="relative bg-background rounded-[calc(1rem-1px)]">
                {children}
            </div>
        </div>
    );
}
