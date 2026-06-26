/**
 * @fileoverview Next.js Instrumentation file.
 * Runs once when the Next.js server starts.
 * Used to register global error handlers from the debug toolkit.
 *
 * Place this file at: src/instrumentation.js
 * (Next.js 15+ automatically discovers and runs this file)
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only import server-side modules within the nodejs runtime guard
    const { setupUncaughtHandlers } = await import('@/lib/debug/uncaught.js')
    const { inspectEnvironment } = await import('@/lib/debug/inspectors.js')
    const { logger } = await import('@/lib/debug/logger.js')

    // Attach global error handlers
    setupUncaughtHandlers()

    // Log env var status on startup
    inspectEnvironment({ module: 'instrumentation' })

    logger.info('🚀 SembakoBerkah server starting...', { module: 'instrumentation', fn: 'register' })
  }
}
