"use client";

import StatsCount from "@/components/ui/statscount";

const stats = [
    { value: 3, suffix: "x", label: "Schneller schreiben" },
    { value: 85, suffix: "%", label: "Zeitersparnis" },
    { value: 50, suffix: "+", label: "Zitierstile" },
];

export function Stats() {
    return (
        <section className="py-20 md:py-28 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 border-y border-border/40 bg-neutral-50/50 dark:bg-neutral-900/50 backdrop-blur-sm -z-10" />

            <StatsCount
                stats={stats}
                title="MAXIMIEREN SIE IHRE PRODUKTIVITÄT"
                showDividers={true}
                className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-sm"
            />
        </section>
    );
}
