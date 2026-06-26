/**
 * @fileoverview Barrel export for the Developer Debug Toolkit.
 * Import everything from a single entry point: `@/lib/debug`
 *
 * @module debug
 *
 * @example
 * import {
 *   logger,
 *   logRequest, logResponse, logError, logQuery, logAuth, logPerformance,
 *   createRequestLogger,
 *   startTimer, withTimer, measureAll, createPerfMark,
 *   createDebugMiddleware, withDebugLogging,
 *   inspectCookies, inspectHeaders, inspectSession, inspectEnvironment,
 *   createDebugClient, logSupabaseAuth, logRealtimeEvent, subscribeWithLogging,
 *   setupUncaughtHandlers,
 *   sanitize, prettyPrint, formatError, formatDuration,
 * } from '@/lib/debug'
 */

// ── Core Logger ────────────────────────────────────────────────────────────────
export {
  logger,
  LOG_LEVELS,
  IS_DEV,
  DEBUG_ENABLED,
  LOGS_DISABLED,
} from './logger.js'

// ── Formatter ──────────────────────────────────────────────────────────────────
export {
  sanitize,
  prettyPrint,
  formatDuration,
  formatError,
  formatStatus,
  SENSITIVE_KEYS,
} from './formatter.js'

// ── Timer ──────────────────────────────────────────────────────────────────────
export {
  startTimer,
  withTimer,
  measureAll,
  createPerfMark,
} from './timer.js'

// ── Helpers ───────────────────────────────────────────────────────────────────
export {
  logRequest,
  logResponse,
  logError,
  logQuery,
  logAuth,
  logPerformance,
  createRequestLogger,
} from './helpers.js'

// ── Middleware ─────────────────────────────────────────────────────────────────
export {
  createDebugMiddleware,
  withDebugLogging,
  generateRequestId,
} from './middleware.js'

// ── Inspectors ─────────────────────────────────────────────────────────────────
export {
  inspectCookies,
  inspectHeaders,
  inspectSession,
  inspectEnvironment,
} from './inspectors.js'

// ── Supabase ───────────────────────────────────────────────────────────────────
export {
  createDebugClient,
  logSupabaseAuth,
  logRealtimeEvent,
  subscribeWithLogging,
} from './supabase.js'

// ── Uncaught Handlers ──────────────────────────────────────────────────────────
export {
  setupUncaughtHandlers,
  teardownUncaughtHandlers,
} from './uncaught.js'
