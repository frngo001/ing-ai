"use client";

import * as React from "react";
import { useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface LazyVideoProps {
    src: string;
    className?: string;
    posterSrc?: string;
}

/**
 * LazyVideo - Only loads and plays video when visible in viewport
 * This dramatically improves initial page load by not loading 300MB+ of videos upfront
 */
export function LazyVideo({ src, className, posterSrc }: LazyVideoProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const isInView = useInView(containerRef, {
        once: false,
        margin: "100px 0px" // Start loading 100px before visible
    });
    const [hasLoaded, setHasLoaded] = React.useState(false);
    const [isPlaying, setIsPlaying] = React.useState(false);

    // Only load video source when in view
    React.useEffect(() => {
        if (isInView && !hasLoaded && videoRef.current) {
            videoRef.current.src = src;
            videoRef.current.load();
            setHasLoaded(true);
        }
    }, [isInView, hasLoaded, src]);

    // Play/pause based on visibility
    React.useEffect(() => {
        const video = videoRef.current;
        if (!video || !hasLoaded) return;

        if (isInView && !isPlaying) {
            video.play().catch(() => {
                // Autoplay might be blocked, that's ok
            });
            setIsPlaying(true);
        } else if (!isInView && isPlaying) {
            video.pause();
            setIsPlaying(false);
        }
    }, [isInView, hasLoaded, isPlaying]);

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            {/* Placeholder shown before video loads */}
            {!hasLoaded && (
                <div className="absolute inset-0 bg-muted/50 animate-pulse rounded-xl flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            )}
            <video
                ref={videoRef}
                className={cn(
                    "w-full h-auto transition-opacity duration-300",
                    hasLoaded ? "opacity-100" : "opacity-0"
                )}
                autoPlay={false}
                loop
                muted
                playsInline
                preload="none"
                poster={posterSrc}
            />
        </div>
    );
}

export default LazyVideo;
