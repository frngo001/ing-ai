'use client';

import { m } from 'framer-motion';
import Image from 'next/image';

export function EditorLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center justify-center gap-4">
        <m.div
          initial={{ opacity: 0.5, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="relative h-34 w-34"
        >
          <Image
            src="/logos/logosApp/ing_AI.png"
            alt="Ing AI"
            fill
            sizes="150px"
            className="object-contain"
            priority
          />
        </m.div>
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((index) => (
            <m.div
              key={index}
              className="h-2 w-2 rounded-full bg-primary"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1.2,
                ease: "easeInOut",
                repeat: Infinity,
                delay: index * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

