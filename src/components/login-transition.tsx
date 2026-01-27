"use client";

import Image from "next/image";
import { m, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

interface LoginTransitionProps {
  isVisible: boolean;
  onComplete: () => void;
}

// Partikel-Komponente für Erfolgs-Animation
function Particle({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <m.div
      className="absolute h-2 w-2 rounded-full bg-emerald-400"
      initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
      animate={{
        scale: [0, 1, 0],
        opacity: [1, 1, 0],
        x: [0, x],
        y: [0, y],
      }}
      transition={{
        duration: 1.2,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    />
  );
}

export function LoginTransition({ isVisible, onComplete }: LoginTransitionProps) {
  const [progress, setProgress] = useState(0);
  const [showCheck, setShowCheck] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const progressSpring = useSpring(0, { stiffness: 100, damping: 30 });

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setShowCheck(false);
      setShowSuccess(false);
      setShowParticles(false);
      progressSpring.set(0);
      return;
    }

    let progressInterval: NodeJS.Timeout;
    let checkTimeout: NodeJS.Timeout;
    let successTimeout: NodeJS.Timeout;
    let completeTimeout: NodeJS.Timeout;

    // Smooth progress animation mit easing
    const startTime = Date.now();
    const duration = 2000; // 2 Sekunden bis 100%

    progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / duration) * 100);

      // Easing-Funktion für smooth progress
      const eased = newProgress < 50
        ? newProgress * newProgress * 0.02
        : 1 - Math.pow(2, -10 * (newProgress / 100));

      const finalProgress = Math.min(100, eased * 100);
      setProgress(finalProgress);
      progressSpring.set(finalProgress);

      if (finalProgress >= 100) {
        clearInterval(progressInterval);
      }
    }, 16); // ~60fps

    // Show checkmark at 75% progress
    checkTimeout = setTimeout(() => {
      setShowCheck(true);
    }, 1500);

    // Show success message and particles
    successTimeout = setTimeout(() => {
      setShowSuccess(true);
      setShowParticles(true);
    }, 2000);

    // Complete after animation
    completeTimeout = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(checkTimeout);
      clearTimeout(successTimeout);
      clearTimeout(completeTimeout);
    };
  }, [isVisible, onComplete, progressSpring]);

  // Generiere Partikel-Positionen einmalig
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      delay: i * 0.05,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
    }));
  }, []);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <m.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Animated background mit mehreren Layern */}
          <m.div
            className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-cyan-500/20"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear",
            }}
            style={{
              backgroundSize: "200% 200%",
            }}
          />

          {/* Zusätzlicher Gradient-Layer für mehr Tiefe */}
          <m.div
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-emerald-500/5 to-transparent"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Mehrere Glowing Orbs mit unterschiedlichen Größen */}
          <m.div
            className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <m.div
            className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-teal-500/15 blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
              x: [0, -40, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          <m.div
            className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-2xl"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.1, 0.3, 0.1],
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
            {/* Logo mit erweiterten Animationen */}
            <m.div
              className="relative h-32 w-32"
              initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
              animate={{
                scale: 1,
                opacity: 1,
                rotate: 0,
                y: showCheck ? -20 : 0,
              }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* Mehrere Glow-Ringe */}
              <m.div
                className="absolute inset-0 rounded-full bg-emerald-500/30 blur-2xl"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <m.div
                className="absolute inset-0 rounded-full bg-teal-500/20 blur-xl"
                animate={{
                  scale: [1.2, 1.6, 1.2],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              />
              <div className="relative z-10 h-full w-full">
                <Image
                  src="/logos/logosApp/ing_AI.png"
                  alt="Ing AI"
                  fill
                  sizes="128px"
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </m.div>

            {/* Success checkmark mit Ripple-Effekt */}
            <AnimatePresence>
              {showCheck && (
                <m.div className="relative">
                  {/* Ripple-Effekte */}
                  {[0, 1, 2].map((i) => (
                    <m.div
                      key={i}
                      className="absolute inset-0 rounded-full border-2 border-emerald-400"
                      initial={{ scale: 0.8, opacity: 0.8 }}
                      animate={{
                        scale: 2.5 + i * 0.5,
                        opacity: 0,
                      }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.2,
                        ease: "easeOut",
                      }}
                    />
                  ))}

                  {/* Checkmark Container */}
                  <m.div
                    initial={{ scale: 0, opacity: 0, rotate: -180 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      rotate: 0,
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                    }}
                    className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-2xl shadow-emerald-500/50"
                  >
                    <m.div
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{
                        delay: 0.3,
                        duration: 0.5,
                        ease: "easeOut",
                      }}
                    >
                      <Check className="h-10 w-10" strokeWidth={3.5} />
                    </m.div>

                    {/* Glow-Effekt */}
                    <m.div
                      className="absolute inset-0 rounded-full bg-emerald-400 blur-xl"
                      animate={{
                        opacity: [0.5, 0.8, 0.5],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </m.div>

                  {/* Partikel-Effekt */}
                  <AnimatePresence>
                    {showParticles && (
                      <div className="absolute inset-0">
                        {particles.map((particle: any) => (
                          <Particle
                            key={particle.id}
                            delay={particle.delay}
                            x={particle.x}
                            y={particle.y}
                          />
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </m.div>
              )}
            </AnimatePresence>

            {/* Loading/Success text mit smooth transitions */}
            <m.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <AnimatePresence mode="wait">
                {!showSuccess ? (
                  <m.div
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <m.h2
                      className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
                      animate={{
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      Wird geladen...
                    </m.h2>
                    <m.p
                      className="text-muted-foreground text-sm"
                      animate={{
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      Bereite deine Arbeitsumgebung vor
                    </m.p>
                  </m.div>
                ) : (
                  <m.div
                    key="success"
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                    }}
                    className="flex flex-col items-center gap-2"
                  >
                    <m.h2
                      className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <m.span
                        animate={{ rotate: [0, 360] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Sparkles className="h-6 w-6 text-emerald-500" />
                      </m.span>
                      Erfolgreich eingeloggt!
                    </m.h2>
                    <m.p
                      className="text-muted-foreground text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.8 }}
                      transition={{ delay: 0.2 }}
                    >
                      Weiterleitung zum Editor...
                    </m.p>
                  </m.div>
                )}
              </AnimatePresence>
            </m.div>

            {/* Verbesserte Progress bar mit Glow */}
            <m.div
              className="relative h-2 w-80 overflow-hidden rounded-full bg-muted/50 backdrop-blur-sm"
              initial={{ opacity: 0, scaleX: 0.8 }}
              animate={{
                opacity: showCheck ? 0 : 1,
                scaleX: showCheck ? 0.8 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Progress fill mit Gradient und Glow */}
              <m.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
                style={{
                  width: progressSpring,
                }}
                transition={{ duration: 0.1 }}
              >
                {/* Glow-Effekt auf Progress */}
                <m.div
                  className="absolute inset-0 rounded-full bg-white/40 blur-sm"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </m.div>

              {/* Shimmer-Effekt */}
              <m.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 0.3,
                }}
                style={{ width: "40%" }}
              />

              {/* Glow am Ende der Progress-Bar */}
              <m.div
                className="absolute inset-y-0 rounded-full bg-emerald-400 blur-md"
                style={{
                  left: progressSpring,
                  width: "20px",
                  marginLeft: "-10px",
                }}
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </m.div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

