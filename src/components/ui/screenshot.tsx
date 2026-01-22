"use client";

import Image, { type ImageProps } from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ScreenshotProps extends Omit<ImageProps, 'src'> {
    srcLight: string;
    srcDark: string;
    priority?: boolean;
}

export default function Screenshot({
    srcLight,
    srcDark,
    alt,
    width,
    height,
    className,
    priority = false,
    ...props
}: ScreenshotProps) {
    const { theme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Image
                src={srcLight}
                alt={alt}
                width={width}
                height={height}
                className={cn("block dark:hidden", className)}
                priority={priority}
                {...props}
            />
        );
    }

    const currentTheme = theme === "system" ? systemTheme : theme;
    const src = currentTheme === "dark" ? srcDark : srcLight;

    return (
        <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={className}
            priority={priority}
            {...props}
        />
    );
}
