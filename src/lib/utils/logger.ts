/**
 * Logging-Utilities die nur im Development-Modus ausgeben
 */

const isDevelopment = () => process.env.NODE_ENV === 'development'

/**
 * Loggt nur im Development-Modus
 */
export const devLog = (...args: unknown[]) => {
  if (isDevelopment()) {
    console.log(...args)
  }
}

/**
 * Warnt nur im Development-Modus
 */
export const devWarn = (...args: unknown[]) => {
  if (isDevelopment()) {
    console.warn(...args)
  }
}

/**
 * Loggt Fehler nur im Development-Modus
 */
export const devError = (...args: unknown[]) => {
  if (isDevelopment()) {
    console.error(...args)
  }
}

/**
 * Loggt Info nur im Development-Modus
 */
export const devInfo = (...args: unknown[]) => {
  if (isDevelopment()) {
    console.info(...args)
  }
}

/**
 * Loggt Debug nur im Development-Modus
 */
export const devDebug = (...args: unknown[]) => {
  if (isDevelopment()) {
    console.debug(...args)
  }
}

