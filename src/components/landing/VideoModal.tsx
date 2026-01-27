
import * as React from "react"
import { m } from "framer-motion";
import { X } from "lucide-react";

export interface FeatureVideo {
    youtubeId?: string;
    videoSrc?: string; // Für lokale Videos
    gifSrc?: string; // Für GIF-Dateien (spielen sich automatisch ab)
    gifSrcLight?: string; // Für GIF-Dateien im Light-Mode
    gifSrcDark?: string; // Für GIF-Dateien im Dark-Mode
    videoLoopSrc?: string; // Für MP4/WebM Loops (effizienter als GIF)
    videoLoopSrcLight?: string; // Für MP4/WebM Loops im Light-Mode
    videoLoopSrcDark?: string; // Für MP4/WebM Loops im Dark-Mode
    thumbnail?: string;
    title?: string;
}

export default function VideoModal({
    video,
    onClose
}: {
    video: FeatureVideo;
    onClose: () => void;
}) {
    if (!video.youtubeId && !video.videoSrc) return null;

    return (
        <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/90 backdrop-blur-sm"
            onClick={onClose}
        >
            <m.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-5xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800">
                    {video.youtubeId ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                            title={video.title || "Feature Video"}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                        />
                    ) : video.videoSrc ? (
                        <video
                            src={video.videoSrc}
                            controls
                            autoPlay
                            className="absolute inset-0 w-full h-full"
                        />
                    ) : null}
                </div>

                {video.title && (
                    <div className="mt-4">
                        <h3 className="text-xl font-semibold text-white">{video.title}</h3>
                    </div>
                )}
            </m.div>
        </m.div>
    );
}
