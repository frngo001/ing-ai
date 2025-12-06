"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ScreenshotProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    srcLight: string;
    srcDark: string;
    alt: string;
    width: number;
    height: number;
}

export default function Screenshot({
    srcLight,
    srcDark,
    alt,
    width,
    height,
    className,
    src: _src, // Destructure src to avoid passing it to Image
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
            {...props}
        />
    );
}
