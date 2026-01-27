"use client";

import { LazyMotion, domMax, motion, useInView, useScroll } from "framer-motion";
import React from "react";

// Wir importieren 'motion' und interne Hooks explizit, um sicherzustellen, 
// dass die Proxy-Module und deren Abhängigkeiten (wie motion-dom) 
// in Next.js Turbopack HMR zur Verfügung stehen.
if (process.env.NODE_ENV === 'development') {
    console.log('Framer Motion System initialized:', {
        motion: !!motion,
        useInView: !!useInView,
        useScroll: !!useScroll
    });
}

export function FramerMotionProvider({ children }: { children: React.ReactNode }) {
    return (
        <LazyMotion features={domMax}>
            {children}
        </LazyMotion>
    );
}
