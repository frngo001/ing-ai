"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

interface LoginTransitionProps {
  isVisible: boolean;
  onComplete: () => void;
}

export function LoginTransition({ isVisible, onComplete }: LoginTransitionProps) {
  const [progress, setProgress] = useState(0);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setShowCheck(false);
      return;
    }

    let progressInterval: NodeJS.Timeout;
    let checkTimeout: NodeJS.Timeout;
    let completeTimeout: NodeJS.Timeout;

    // Progress animation
    progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    // Show checkmark at 80% progress (around 2.4 seconds)
    checkTimeout = setTimeout(() => {
      setShowCheck(true);
    }, 2400);

    // Complete after animation
    completeTimeout = setTimeout(() => {
      setTimeout(() => {
        onComplete();
      }, 500);
    }, 3500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(checkTimeout);
      clearTimeout(completeTimeout);
    };
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Animated background gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-emerald-500/10"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              backgroundSize: "200% 200%",
            }}
          />

          {/* Glowing orbs */}
          <motion.div
            className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center gap-8">
            {/* Logo with animation */}
            <motion.div
              className="relative h-32 w-32"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div className="relative h-full w-full">
                <Image
                  src="/logos/logosApp/ing_AI.png"
                  alt="Ing AI"
                  fill
                  sizes="128px"
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>

            {/* Success checkmark */}
            <AnimatePresence>
              {showCheck && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/50"
                >
                  <Check className="h-8 w-8" strokeWidth={3} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading text */}
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.h2
                className="text-2xl font-bold"
                animate={{
                  opacity: showCheck ? 0 : 1,
                }}
              >
                {showCheck ? "Erfolgreich eingeloggt!" : "Wird geladen..."}
              </motion.h2>
              <motion.p
                className="text-muted-foreground text-sm"
                animate={{
                  opacity: showCheck ? 0 : 0.7,
                }}
              >
                Bereite deine Arbeitsumgebung vor
              </motion.p>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              className="relative h-1 w-64 overflow-hidden rounded-full bg-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: showCheck ? 0 : 1 }}
            >
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{ width: "50%" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

