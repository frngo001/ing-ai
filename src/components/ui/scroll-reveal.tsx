"use client";

import { m, useInView, Variants } from "framer-motion";
import { useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
    distance?: number;
    once?: boolean;
    threshold?: number;
}

export function ScrollReveal({
    children,
    className,
    delay = 0,
    duration = 0.6,
    direction = "up",
    distance = 30,
    once = true,
    threshold = 0.1,
}: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once, amount: threshold });

    const getInitialPosition = () => {
        switch (direction) {
            case "up":
                return { y: distance, x: 0 };
            case "down":
                return { y: -distance, x: 0 };
            case "left":
                return { x: distance, y: 0 };
            case "right":
                return { x: -distance, y: 0 };
            case "none":
                return { x: 0, y: 0 };
        }
    };

    const variants: Variants = {
        hidden: {
            opacity: 0,
            ...getInitialPosition(),
        },
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: {
                duration,
                delay,
                ease: [0.25, 0.4, 0.25, 1],
            },
        },
    };

    return (
        <m.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={variants}
            className={cn(className)}
        >
            {children}
        </m.div>
    );
}

// Stagger container for animating children in sequence
interface StaggerContainerProps {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
    once?: boolean;
}

export function StaggerContainer({
    children,
    className,
    staggerDelay = 0.1,
    once = true,
}: StaggerContainerProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once, amount: 0.1 });

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: staggerDelay,
                delayChildren: 0.1,
            },
        },
    };

    return (
        <m.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={containerVariants}
            className={cn(className)}
        >
            {children}
        </m.div>
    );
}

// Item to be used inside StaggerContainer
interface StaggerItemProps {
    children: ReactNode;
    className?: string;
    direction?: "up" | "down" | "left" | "right" | "none";
}

export function StaggerItem({ children, className, direction = "up" }: StaggerItemProps) {
    const getDirection = () => {
        switch (direction) {
            case "up":
                return { y: 20 };
            case "down":
                return { y: -20 };
            case "left":
                return { x: 20 };
            case "right":
                return { x: -20 };
            default:
                return {};
        }
    };

    const itemVariants: Variants = {
        hidden: {
            opacity: 0,
            ...getDirection(),
        },
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: {
                duration: 0.5,
                ease: [0.25, 0.4, 0.25, 1],
            },
        },
    };

    return (
        <m.div variants={itemVariants} className={cn(className)}>
            {children}
        </m.div>
    );
}

// Floating animation for decorative elements
interface FloatingElementProps {
    children: ReactNode;
    className?: string;
    duration?: number;
    distance?: number;
}

export function FloatingElement({
    children,
    className,
    duration = 3,
    distance = 10,
}: FloatingElementProps) {
    return (
        <m.div
            animate={{
                y: [0, -distance, 0],
            }}
            transition={{
                duration,
                repeat: Infinity,
                ease: "easeInOut",
            }}
            className={cn(className)}
        >
            {children}
        </m.div>
    );
}

// Scale on hover component
interface ScaleOnHoverProps {
    children: ReactNode;
    className?: string;
    scale?: number;
}

export function ScaleOnHover({ children, className, scale = 1.02 }: ScaleOnHoverProps) {
    return (
        <m.div
            whileHover={{ scale }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(className)}
        >
            {children}
        </m.div>
    );
}
