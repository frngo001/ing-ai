"use client";
import React, { useRef, useState, useEffect } from "react";
import { useScroll, motion, useMotionValueEvent, AnimatePresence } from "framer-motion";
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
        // Find the index of the card whose starting point is closest to current scroll position
        // We use a small offset (0.1 / cardLength) to delay the switch slightly for better visual alignment
        const closestBreakpointIndex = Math.min(
            Math.floor((latest + (0.5 / cardLength)) * cardLength),
            cardLength - 1
        );
        setActiveCard(closestBreakpointIndex);
    });

    return (
        <div
            ref={containerRef}
            className="relative flex justify-center space-x-10 py-2"
        >
            <div className="relative flex items-start px-4 w-full max-w-[90rem]">
                <div className="flex-1 w-full pr-10">
                    {content.map((item, index) => (
                        <div key={item.title + index} className="my-32 md:my-64 first:mt-16 md:first:mt-32 last:mb-64">
                            {item.category && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{
                                        opacity: activeCard === index ? 1 : 0.3,
                                    }}
                                    className="mb-4"
                                >
                                    <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                                        {item.category}
                                    </span>
                                    {item.categoryDescription && (
                                        <p className="text-xs md:text-sm text-neutral-400 dark:text-neutral-500 mt-1 max-w-sm">
                                            {item.categoryDescription}
                                        </p>
                                    )}
                                </motion.div>
                            )}
                            <motion.h2
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: activeCard === index ? 1 : 0.3,
                                }}
                                className="text-2xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight tracking-tight"
                            >
                                {item.title}
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: activeCard === index ? 1 : 0.3,
                                }}
                                className="text-base md:text-lg text-neutral-500 dark:text-neutral-400 mt-6 md:mt-8 max-w-md leading-relaxed"
                            >
                                {item.description}
                            </motion.p>
                            <div className="block lg:hidden mt-10">
                                {item.content}
                            </div>
                        </div>
                    ))}
                    <div className="h-20 lg:h-64" />
                </div>

                <div
                    className={cn(
                        "hidden lg:block h-[500px] md:h-[600px] w-full max-w-2xl sticky top-32 overflow-hidden flex items-center justify-center rounded-2xl",
                        contentClassName
                    )}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeCard}
                            initial={{ opacity: 0, scale: 0.98, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: -5 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            {content[activeCard].content ?? null}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
