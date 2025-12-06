"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MarqueeProps {
    children: ReactNode;
    className?: string;
    reverse?: boolean;
    pauseOnHover?: boolean;
    vertical?: boolean;
    repeat?: number;
    duration?: string;
}

export function Marquee({
    children,
    className,
    reverse = false,
    pauseOnHover = true,
    vertical = false,
    repeat = 4,
    duration = "40s",
}: MarqueeProps) {
    return (
        <div
            className={cn(
                "group flex overflow-hidden",
                vertical ? "flex-col" : "flex-row",
                className
            )}
        >
            {Array.from({ length: repeat }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "flex shrink-0",
                        vertical ? "flex-col" : "flex-row",
                        vertical
                            ? reverse
                                ? "animate-marquee-up"
                                : "animate-marquee-down"
                            : reverse
                                ? "animate-marquee-right"
                                : "animate-marquee-left",
                        pauseOnHover && "group-hover:[animation-play-state:paused]"
                    )}
                    style={{
                        animationDuration: duration,
                    }}
                >
                    {children}
                </div>
            ))}
        </div>
    );
}
