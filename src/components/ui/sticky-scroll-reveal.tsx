"use client";
import React, { useRef, useState } from "react";
import { useScroll, m, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const StickyScroll = ({
    content,
    contentClassName,
}: {
    content: {
        title: string;
        description: string;
        category?: string;
        categoryDescription?: string;
        content?: React.ReactNode | any;
    }[];
    contentClassName?: string;
}) => {
    const [activeCard, setActiveCard] = useState(0);
    const containerRef = useRef<any>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const cardLength = content.length;

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        const closestBreakpointIndex = Math.min(
            Math.floor((latest + (0.5 / cardLength)) * cardLength),
            cardLength - 1
        );
        setActiveCard(closestBreakpointIndex);
    });

    return (
        <>
            {/* Mobile Layout - Simple vertical cards */}
            <div className="lg:hidden space-y-6 sm:space-y-8">
                {content.map((item, index) => (
                    <m.div
                        key={item.title + index}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-30px" }}
                        transition={{ duration: 0.35, delay: index * 0.03 }}
                        className="space-y-2.5 sm:space-y-3 text-center"
                    >
                        {/* Category badge */}
                        {item.category && (
                            <span className="inline-block text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                {item.category}
                            </span>
                        )}

                        {/* Title */}
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                            {item.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                            {item.description}
                        </p>

                        {/* Video/Content */}
                        <div className="pt-1.5 sm:pt-2">
                            {item.content}
                        </div>
                    </m.div>
                ))}
            </div>

            {/* Desktop Layout - Sticky scroll */}
            <div
                ref={containerRef}
                className="hidden lg:flex relative justify-center space-x-10 py-2"
            >
                <div className="relative flex items-start px-4 w-full max-w-[90rem]">
                    <div className="flex-1 w-full pr-10">
                        {content.map((item, index) => (
                            <div key={item.title + index} className="my-40 first:mt-32 last:mb-64">
                                {item.category && (
                                    <m.div
                                        initial={{ opacity: 0 }}
                                        animate={{
                                            opacity: activeCard === index ? 1 : 0.3,
                                        }}
                                        className="mb-4"
                                    >
                                        <span className="text-sm font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                                            {item.category}
                                        </span>
                                        {item.categoryDescription && (
                                            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1 max-w-sm">
                                                {item.categoryDescription}
                                            </p>
                                        )}
                                    </m.div>
                                )}
                                <m.h2
                                    initial={{ opacity: 0 }}
                                    animate={{
                                        opacity: activeCard === index ? 1 : 0.3,
                                    }}
                                    className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight tracking-tight"
                                >
                                    {item.title}
                                </m.h2>
                                <m.p
                                    initial={{ opacity: 0 }}
                                    animate={{
                                        opacity: activeCard === index ? 1 : 0.3,
                                    }}
                                    className="text-lg text-neutral-500 dark:text-neutral-400 mt-8 max-w-md leading-relaxed"
                                >
                                    {item.description}
                                </m.p>
                            </div>
                        ))}
                        <div className="h-64" />
                    </div>

                    {/* Desktop sticky video panel */}
                    <div
                        className={cn(
                            "h-[500px] xl:h-[600px] w-full max-w-xl xl:max-w-2xl sticky top-32 overflow-hidden flex items-center justify-center rounded-2xl",
                            contentClassName
                        )}
                    >
                        <AnimatePresence mode="wait">
                            <m.div
                                key={activeCard}
                                initial={{ opacity: 0, scale: 0.98, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -5 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="w-full h-full flex items-center justify-center"
                            >
                                {content[activeCard].content ?? null}
                            </m.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </>
    );
};
