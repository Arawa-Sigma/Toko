/**
 * @fileoverview Global uncaught exception and unhandled rejection handlers.
 * Attaches Node.js process listeners to capture crashes with full context.
 * Should be called once at server startup (e.g., in instrumentation.js).
 *
 * Only activates in development or when DEBUG=true.
 *
 * @module debug/uncaught
 */

import { logger } from './logger.js'
import { formatError } from './formatter.js'
import { IS_DEV, DEBUG_ENABLED } from './logger.js'

// ─── State Guard ──────────────────────────────────────────────────────────────

/** @type {boolean} Tracks whether handlers have already been attached */
let _handlersAttached = false

// ─── setupUncaughtHandlers ────────────────────────────────────────────────────

/**
 * @typedef {Object} UncaughtHandlerOptions
 * @property {boolean} [exitOnUncaught=false]
 * - If true, the process will exit after an uncaughtException (not recommended for Next.js)
 * @property {(err: Error, type: 'uncaughtException'|'unhandledRejection') => void} [onError]
 * - Optional custom callback invoked after the error is logged
 */

/**
 * Attaches global Node.js error handlers that log uncaught exceptions
 * and unhandled promise rejections using the debug toolkit.
 *
 * Calling this function multiple times is safe — handlers are only attached once.
 *
 * **Where to call this:**
 * Place in `src/instrumentation.js` (Next.js 15+) for automatic server-side registration.
 *
 * @param {UncaughtHandlerOptions} [options]
 *
 * @example
 * // src/instrumentation.js
 * import { setupUncaughtHandlers } from '@/lib/debug'
 *
 * export async function register() {
 *   setupUncaughtHandlers()
 * }
 */
function setupUncaughtHandlers(options = {}) {
  // Only run on server side
  if (typeof process === 'undefined') return

  // Only activate in dev or with explicit DEBUG
  if (!IS_DEV && !DEBUG_ENABLED) return

  // Prevent duplicate attachment
  if (_handlersAttached) {
    logger.debug('⚠️  setupUncaughtHandlers: already attached, skipping.', {
      module: 'debug/uncaught',
      fn: 'setupUncaughtHandlers',
    })
    return
  }

  const { exitOnUncaught = false, onError } = options

  // ── uncaughtException ──
  process.on('uncaughtException', (err) => {
    const report = formatError(err, {
      module: 'process',
      fn: 'uncaughtException',
    })

    console.error('\n' + report)
    logger.error('💥 Uncaught Exception — process may be in an unstable state!', {
      module: 'debug/uncaught',
      fn: 'uncaughtException',
    })

    if (typeof onError === 'function') {
      try {
        onError(err, 'uncaughtException')
      } catch {
        // Swallow errors from user callback to avoid recursion
      }
    }

    if (exitOnUncaught) {
      process.exit(1)
    }
  })

  // ── unhandledRejection ──
  process.on('unhandledRejection', (reason, promise) => {
    const err = reason instanceof Error ? reason : new Error(String(reason))

    const report = formatError(err, {
      module: 'process',
      fn: 'unhandledRejection',
    })

    console.error('\n' + report)
    logger.error('💥 Unhandled Promise Rejection!', {
      module: 'debug/uncaught',
      fn: 'unhandledRejection',
      data: { promise: String(promise) },
    })

    if (typeof onError === 'function') {
      try {
        onError(err, 'unhandledRejection')
      } catch {
        // Swallow errors from user callback
      }
    }
  })

  // ── SIGTERM / SIGINT (graceful shutdown logging) ──
  process.on('SIGTERM', () => {
    logger.info('🛑 SIGTERM received — shutting down gracefully...', {
      module: 'debug/uncaught',
      fn: 'SIGTERM',
    })
  })

  process.on('SIGINT', () => {
    logger.info('🛑 SIGINT received — shutting down...', {
      module: 'debug/uncaught',
      fn: 'SIGINT',
    })
  })

  _handlersAttached = true

  logger.success('🛡️  Global error handlers attached (uncaughtException + unhandledRejection)', {
    module: 'debug/uncaught',
    fn: 'setupUncaughtHandlers',
  })
}

/**
 * Detaches uncaught handlers and resets the attachment state.
 * Useful for testing or when re-initializing in a specific environment.
 */
function teardownUncaughtHandlers() {
  if (!_handlersAttached) return
  process.removeAllListeners('uncaughtException')
  process.removeAllListeners('unhandledRejection')
  _handlersAttached = false
  logger.debug('🛡️  Global error handlers detached.', {
    module: 'debug/uncaught',
    fn: 'teardownUncaughtHandlers',
  })
}

export { setupUncaughtHandlers, teardownUncaughtHandlers }
