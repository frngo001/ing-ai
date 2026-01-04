'use client';

import { motion } from 'motion/react';

export function EditorLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center justify-center gap-4">
        {/* LoaderThree mit App-Farben (Primary: #3ECF8E) */}
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-20 w-20 stroke-primary"
          style={{
            '--fill-final': '#3ECF8E',
            '--fill-initial': '#3ECF8E33',
          } as React.CSSProperties}
        >
          <motion.path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <motion.path
            initial={{ pathLength: 0, fill: "var(--fill-initial)" }}
            animate={{ pathLength: 1, fill: "var(--fill-final)" }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
            }}
            d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11"
          />
        </motion.svg>
      </div>
    </div>
  );
}

