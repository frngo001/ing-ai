'use client';

import type { PlatePluginConfig } from 'platejs/react';

import {
  FontBackgroundColorPlugin,
  FontColorPlugin,
  FontFamilyPlugin,
  FontSizePlugin,
} from '@platejs/basic-styles/react';
import { KEYS } from 'platejs';

const options = {
  inject: {
    targetPlugins: [
      ...KEYS.heading,
      KEYS.p,
      KEYS.blockquote,
    ],
  },
} satisfies PlatePluginConfig;

/**
 * Parst eine Farbe und gibt RGB-Werte zurück
 */
function parseColorToRGB(color: string): { r: number; g: number; b: number } | null {
  const normalizedColor = color.toLowerCase().trim();

  // rgb() Format
  const rgbMatch = normalizedColor.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // 6-stelliges Hex Format
  const hex6Match = normalizedColor.match(/^#([0-9a-f]{6})$/);
  if (hex6Match) {
    const hex = hex6Match[1];
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  // 3-stelliges Hex Format
  const hex3Match = normalizedColor.match(/^#([0-9a-f]{3})$/);
  if (hex3Match) {
    const hex = hex3Match[1];
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    };
  }

  // Bekannte Farbnamen
  const colorNames: Record<string, { r: number; g: number; b: number }> = {
    white: { r: 255, g: 255, b: 255 },
    black: { r: 0, g: 0, b: 0 },
  };

  return colorNames[normalizedColor] || null;
}

/**
 * Prüft, ob eine Farbe "hell" ist (weiß, sehr helles Grau, etc.)
 * Diese Farben werden im Dark Mode als transparent behandelt
 */
function isLightBackgroundColor(color: string | undefined): boolean {
  if (!color) return false;

  const rgb = parseColorToRGB(color);
  if (!rgb) return false;

  // Wenn alle RGB-Werte > 220, ist es eine sehr helle Farbe
  return rgb.r > 220 && rgb.g > 220 && rgb.b > 220;
}

/**
 * Prüft, ob eine Farbe "dunkel" ist (schwarz, sehr dunkles Grau, etc.)
 * Diese Farben werden beim Einfügen entfernt, damit der Text die Theme-Farbe verwendet
 */
function isDarkTextColor(color: string | undefined): boolean {
  if (!color) return false;

  const rgb = parseColorToRGB(color);
  if (!rgb) return false;

  // Wenn alle RGB-Werte < 50, ist es eine sehr dunkle Farbe (schwarz/dunkelgrau)
  return rgb.r < 50 && rgb.g < 50 && rgb.b < 50;
}

export const FontKit = [
  FontColorPlugin.configure({
    inject: {
      ...options.inject,
      nodeProps: {
        defaultNodeValue: 'black',
      },
    },
    parsers: {
      html: {
        deserializer: {
          parse: ({ element }) => {
            const style = element.style;
            const color = style?.color;

            // Wenn die Farbe "dunkel" ist (schwarz/dunkelgrau), nicht anwenden
            // damit der Text die Theme-Farbe verwendet (weiß im Dark Mode)
            if (isDarkTextColor(color)) {
              return { color: undefined };
            }

            return color ? { color } : undefined;
          },
        },
      },
    },
  }),
  FontBackgroundColorPlugin.configure({
    ...options,
    parsers: {
      html: {
        deserializer: {
          parse: ({ element }) => {
            const style = element.style;
            const backgroundColor = style?.backgroundColor;

            // Wenn die Farbe "hell" ist, gib null zurück (nicht anwenden)
            if (isLightBackgroundColor(backgroundColor)) {
              return { backgroundColor: undefined };
            }

            return backgroundColor ? { backgroundColor } : undefined;
          },
        },
      },
    },
  }),
  FontSizePlugin.configure({
    ...options,
    parsers: {
      html: {
        deserializer: {
          parse: ({ element }) => {
            const fontSize = element.style?.fontSize;
            return fontSize ? { fontSize } : undefined;
          },
        },
      },
    },
  }),
  FontFamilyPlugin.configure({
    ...options,
    parsers: {
      html: {
        deserializer: {
          parse: ({ element }) => {
            const fontFamily = element.style?.fontFamily;
            return fontFamily ? { fontFamily } : undefined;
          },
        },
      },
    },
  }),
];
