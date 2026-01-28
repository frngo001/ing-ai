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
            {/* Mobile Layout - Refined Grouped Bento Style */}
            <div className="lg:hidden space-y-12 mb-16">
                {Object.values(content.reduce((acc: any, item, index) => {
                    const category = item.category || "General";
                    if (!acc[category]) {
                        acc[category] = {
                            name: category,
                            description: item.categoryDescription,
                            items: []
                        };
                    }
                    acc[category].items.push({ ...item, index });
                    return acc;
                }, {})).map((group: any) => (
                    <div key={group.name} className="space-y-6">
                        {/* Group Header */}
                        <div className="px-2 space-y-1.5">
                            <div className="flex items-center gap-3">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
                                    {group.name}
                                </h3>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-blue-500/20 to-transparent" />
                            </div>
                            {group.description && (
                                <p className="text-[13px] text-muted-foreground/70 font-medium leading-relaxed max-w-[280px]">
                                    {group.description}
                                </p>
                            )}
                        </div>

                        {/* Group Items Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {group.items.map((item: any) => (
                                <m.div
                                    key={item.title + item.index}
                                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{
                                        duration: 0.4,
                                        delay: item.index * 0.05,
                                        ease: [0.21, 0.47, 0.32, 0.98]
                                    }}
                                    className="group relative flex flex-col rounded-[2rem] border border-neutral-200/50 dark:border-neutral-800/50 bg-white dark:bg-neutral-900/40 shadow-sm overflow-hidden"
                                >
                                    {/* Video/Content */}
                                    <div className="relative aspect-[16/10] overflow-hidden bg-muted/20">
                                        {item.content}
                                    </div>

                                    {/* Text Content */}
                                    <div className="p-6 flex flex-col flex-1">
                                        <h4 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100 mb-2 tracking-tight text-balance">
                                            {item.title}
                                        </h4>
                                        <p className="text-[13px] text-muted-foreground/90 leading-[1.6] font-medium">
                                            {item.description}
                                        </p>
                                    </div>

                                    <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-blue-500 transition-all duration-500 ease-out group-hover:w-full" />
                                </m.div>
                            ))}
                        </div>
                    </div>
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
                                <m.h3
                                    initial={{ opacity: 0 }}
                                    animate={{
                                        opacity: activeCard === index ? 1 : 0.3,
                                    }}
                                    className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight tracking-tight"
                                >
                                    {item.title}
                                </m.h3>
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
