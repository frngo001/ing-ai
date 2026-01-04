'use client';

import Image from 'next/image';

export function EditorLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="relative h-24 w-24">
          {/* SVG Loader - Rotierender Kreis rund um das Logo */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Hintergrund-Kreis */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted-foreground/20"
            />
            {/* Rotierender Loader-Kreis */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="70 200"
              className="text-primary"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 50 50"
                to="360 50 50"
                dur="1.2s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
          
          {/* Logo in der Mitte */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Image
              src="/logos/logosApp/ing_AI.png"
              alt="Ing AI"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}

