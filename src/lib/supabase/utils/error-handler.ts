/**
 * Loggt Supabase-Fehler mit Kontextinformationen
 */
export function logSupabaseError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorCode = (error as any)?.code
  const errorStatus = (error as any)?.status
  const errorDetails = (error as any)?.details

  console.error(`❌ [${context}] Supabase-Fehler:`, {
    message: errorMessage,
    code: errorCode,
    status: errorStatus,
    details: errorDetails,
    ...metadata,
  })
}
