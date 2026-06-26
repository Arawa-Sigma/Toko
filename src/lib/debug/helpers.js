/**
 * @fileoverview High-level helper functions for the Developer Debug Toolkit.
 * Provides domain-specific log helpers: logRequest, logResponse, logError,
 * logQuery, logAuth, and logPerformance.
 *
 * @module debug/helpers
 */

import { logger } from './logger.js'
import { sanitize, prettyPrint, formatError, formatDuration, formatStatus } from './formatter.js'
import { startTimer } from './timer.js'

// ─── logRequest ───────────────────────────────────────────────────────────────

/**
 * @typedef {Object} RequestLogOptions
 * @property {string}               method      - HTTP method (GET, POST, etc.)
 * @property {string}               url         - Full request URL
 * @property {Record<string, *>}    [params]    - Route params (e.g. { id: '123' })
 * @property {Record<string, *>}    [searchParams] - Query string params
 * @property {Record<string, *>}    [headers]   - Request headers (will be sanitized)
 * @property {*}                    [body]      - Request body (will be sanitized)
 * @property {string}               [userId]    - Authenticated user ID
 * @property {string}               [requestId] - Request ID from middleware
 * @property {string}               [module]    - File/module name
 * @property {string}               [fn]        - Function/handler name
 */

/**
 * Logs an incoming HTTP request with method, URL, params, headers, and auth info.
 * Sensitive fields in headers and body are automatically redacted.
 *
 * @param {RequestLogOptions} options
 *
 * @example
 * // In a Route Handler:
 * logRequest({
 *   method: 'POST',
 *   url: request.url,
 *   headers: Object.fromEntries(request.headers),
 *   userId: session?.user?.id,
 *   requestId: request.headers.get('x-request-id'),
 *   module: 'api/orders/route',
 *   fn: 'POST',
 * })
 */
function logRequest(options) {
  const {
    method,
    url,
    params,
    searchParams,
    headers,
    body,
    userId,
    requestId,
    module: mod,
    fn,
  } = options

  const { pathname, search } = (() => {
    try {
      const u = new URL(url)
      return { pathname: u.pathname, search: u.search }
    } catch {
      return { pathname: url, search: '' }
    }
  })()

  const parts = [
    `${method ?? 'GET'} ${pathname}${search}`,
    userId ? `👤 ${userId.slice(0, 8)}...` : '👤 anonymous',
  ]

  logger.api(`→ ${parts.join('  ')}`, { module: mod, fn, requestId })

  // Detailed data only at debug level
  if (params && Object.keys(params).length > 0) {
    logger.debug('  params', { module: mod, fn, requestId, data: params })
  }
  if (searchParams && Object.keys(searchParams).length > 0) {
    logger.debug('  searchParams', { module: mod, fn, requestId, data: searchParams })
  }
  if (headers) {
    logger.debug('  headers', {
      module: mod,
      fn,
      requestId,
      data: sanitize(headers),
    })
  }
  if (body !== undefined) {
    logger.debug('  body', {
      module: mod,
      fn,
      requestId,
      data: sanitize(body),
    })
  }
}

// ─── logResponse ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} ResponseLogOptions
 * @property {number}  status      - HTTP response status code
 * @property {number}  duration    - Response time in ms
 * @property {*}       [data]      - Response body (will be sanitized)
 * @property {string}  [requestId] - Request ID
 * @property {string}  [module]    - File/module name
 * @property {string}  [fn]        - Function/handler name
 * @property {string}  [method]    - HTTP method (for display)
 * @property {string}  [url]       - URL (for display)
 */

/**
 * Logs the HTTP response status, duration, and optional body.
 *
 * @param {ResponseLogOptions} options
 *
 * @example
 * logResponse({
 *   status: 200,
 *   duration: timer.stop(),
 *   requestId,
 *   module: 'api/orders/route',
 *   fn: 'POST',
 * })
 */
function logResponse(options) {
  const { status, duration, data, requestId, module: mod, fn, method, url } = options

  const statusStr = formatStatus(status)
  const durStr = formatDuration(duration)
  const urlPart = url
    ? ` ${method ?? ''} ${(() => { try { return new URL(url).pathname } catch { return url } })()}`
    : ''

  const level = status >= 500 ? 'error' : status >= 400 ? 'warning' : 'success'
  logger[level](
    `← ${statusStr}${urlPart}  ${durStr}`,
    { module: mod, fn, requestId, duration, data: data !== undefined ? sanitize(data) : undefined },
  )
}

// ─── logError ─────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} ErrorLogOptions
 * @property {Error|unknown} error      - The error to log
 * @property {string}        [module]   - File/module name
 * @property {string}        [fn]       - Function/handler name
 * @property {string}        [requestId]- Request ID
 * @property {string}        [method]   - HTTP method
 * @property {string}        [url]      - URL
 * @property {string}        [userId]   - Authenticated user ID
 * @property {*}             [input]    - Input that triggered the error
 */

/**
 * Logs a rich, formatted error report including stack trace, cause chain,
 * and request context. Automatically sanitizes any input data.
 *
 * @param {ErrorLogOptions} options
 *
 * @example
 * try {
 *   await risky()
 * } catch (err) {
 *   logError({ error: err, module: 'api/orders/route', fn: 'POST', requestId })
 * }
 */
function logError({ error, module: mod, fn, requestId, method, url, userId, input }) {
  const ctx = {
    module: mod,
    fn,
    requestId,
    method,
    url,
    userId,
    input,
  }

  const formatted = formatError(error, ctx)
  console.error(formatted) // Use raw console to preserve ANSI blocks
}

// ─── logQuery ─────────────────────────────────────────────────────────────────

/**
 * @typedef {'SELECT'|'INSERT'|'UPDATE'|'DELETE'|'UPSERT'|'RPC'|'REALTIME'} DbOperation
 */

/**
 * @typedef {Object} QueryLogOptions
 * @property {DbOperation}           operation   - Type of DB operation
 * @property {string}                table       - Supabase table name
 * @property {Record<string, *>}     [filter]    - Filter/where conditions
 * @property {*}                     [data]      - Data being written (sanitized)
 * @property {number}                [duration]  - Query execution time in ms
 * @property {number}                [rowCount]  - Number of rows affected/returned
 * @property {*}                     [error]     - Supabase error if any
 * @property {string}                [requestId] - Request ID
 * @property {string}                [module]    - File/module name
 * @property {string}                [fn]        - Function name
 */

/** @type {Record<DbOperation, string>} Emoji per DB operation */
const DB_EMOJI = {
  SELECT: '📋',
  INSERT: '➕',
  UPDATE: '✏️ ',
  DELETE: '🗑️ ',
  UPSERT: '🔄',
  RPC: '⚙️ ',
  REALTIME: '📡',
}

/**
 * Logs a Supabase database operation with table, filter, duration, and row count.
 *
 * @param {QueryLogOptions} options
 *
 * @example
 * logQuery({
 *   operation: 'SELECT',
 *   table: 'profiles',
 *   filter: { role: 'Owner' },
 *   duration: 43,
 *   rowCount: 1,
 *   module: 'dashboard/users/page',
 * })
 */
function logQuery({ operation, table, filter, data, duration, rowCount, error, requestId, module: mod, fn }) {
  const emoji = DB_EMOJI[operation] ?? '🔷'
  const filterStr = filter ? ` WHERE ${prettyPrint(filter, { sanitizeData: false })}` : ''
  const rowStr = rowCount != null ? `  rows: ${rowCount}` : ''

  if (error) {
    logger.database(
      `${emoji} ${operation} ${table}${filterStr}  ❌ ERROR${rowStr}`,
      { module: mod, fn, requestId, duration, data: error },
    )
  } else {
    logger.database(
      `${emoji} ${operation} ${table}${filterStr}${rowStr}`,
      { module: mod, fn, requestId, duration, data: data !== undefined ? sanitize(data) : undefined },
    )
  }
}

// ─── logAuth ──────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} AuthLogOptions
 * @property {string}  event       - Auth event name (e.g. 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED')
 * @property {string}  [userId]    - User ID (first 8 chars shown)
 * @property {string}  [email]     - User email (shown only at debug level)
 * @property {string}  [role]      - User role
 * @property {string}  [provider]  - OAuth provider (e.g. 'google', 'github')
 * @property {string}  [requestId] - Request ID
 * @property {string}  [module]    - File/module name
 * @property {string}  [fn]        - Function name
 * @property {*}       [error]     - Auth error if any
 */

/** @type {Record<string, string>} Auth event emojis */
const AUTH_EMOJI = {
  SIGNED_IN: '🟢',
  SIGNED_OUT: '🔴',
  TOKEN_REFRESHED: '🔁',
  USER_UPDATED: '👤',
  PASSWORD_RECOVERY: '🔑',
  MFA_CHALLENGE_VERIFIED: '🛡️ ',
  USER_DELETED: '🗑️ ',
}

/**
 * Logs an authentication event with user ID, role, provider, and event type.
 *
 * @param {AuthLogOptions} options
 *
 * @example
 * logAuth({ event: 'SIGNED_IN', userId: session.user.id, role: 'Owner', module: 'middleware' })
 */
function logAuth({ event, userId, email: _email, role, provider, requestId, module: mod, fn, error }) {
  const emoji = AUTH_EMOJI[event] ?? '🔐'
  const userStr = userId ? ` user:${userId.slice(0, 8)}...` : ' anonymous'
  const roleStr = role ? ` [${role}]` : ''
  const provStr = provider ? ` via ${provider}` : ''
  const errStr = error ? ' ❌' : ''

  if (error) {
    logger.auth(`${emoji} ${event}${userStr}${roleStr}${provStr}${errStr}`, {
      module: mod,
      fn,
      requestId,
      data: error,
    })
  } else {
    logger.auth(`${emoji} ${event}${userStr}${roleStr}${provStr}`, {
      module: mod,
      fn,
      requestId,
    })
  }
}

// ─── logPerformance ───────────────────────────────────────────────────────────

/**
 * @typedef {Object} PerfLogOptions
 * @property {string}  label       - Name of the performance measurement
 * @property {number}  duration    - Elapsed time in ms
 * @property {string}  [module]    - File/module name
 * @property {string}  [fn]        - Function name
 * @property {string}  [requestId] - Request ID
 * @property {'slow'|'ok'|'fast'} [rating] - Optional manual rating
 */

/** Threshold in ms above which a measurement is considered "slow" */
const PERF_SLOW_THRESHOLD_MS = 1000

/**
 * Logs a named performance measurement.
 * Automatically rates: ≤200ms = fast, ≤1000ms = ok, >1000ms = slow.
 *
 * @param {PerfLogOptions} options
 *
 * @example
 * const timer = startTimer()
 * await heavyOperation()
 * logPerformance({ label: 'heavyOperation', duration: timer.stop(), module: 'lib/heavy' })
 */
function logPerformance({ label, duration, module: mod, fn, requestId, rating: manualRating }) {
  const autoRating = duration > PERF_SLOW_THRESHOLD_MS ? 'slow' : duration > 200 ? 'ok' : 'fast'
  const rating = manualRating ?? autoRating
  const ratingEmoji = { fast: '⚡', ok: '🟡', slow: '🐢' }[rating] ?? '📊'
  const ratingColor = { fast: 'success', ok: 'info', slow: 'warning' }[rating] ?? 'info'

  logger[ratingColor](
    `${ratingEmoji} PERF [${label}]  ${formatDuration(duration)}  (${rating})`,
    { module: mod, fn, requestId, duration },
  )
}

// ─── createRequestLogger ──────────────────────────────────────────────────────

/**
 * Creates a request-scoped logger bundle. Starts a timer automatically.
 * Returns pre-bound helpers so you don't need to pass requestId on every call.
 *
 * @param {object} options
 * @param {string} options.method
 * @param {string} options.url
 * @param {string} [options.requestId]
 * @param {string} [options.userId]
 * @param {string} [options.module]
 * @param {string} [options.fn]
 * @returns {{ timer: import('./timer.js').Timer, logReq: Function, logRes: Function, logErr: Function, logQ: Function, ctx: import('./logger.js').LogContext }}
 *
 * @example
 * const rl = createRequestLogger({
 *   method: 'POST',
 *   url: request.url,
 *   requestId: request.headers.get('x-request-id'),
 *   module: 'api/orders/route',
 *   fn: 'POST',
 * })
 * rl.logReq({ headers, body, userId })
 * // ... handler logic ...
 * rl.logRes({ status: 200 })
 */
function createRequestLogger({ method, url, requestId, userId, module: mod, fn }) {
  const timer = startTimer()
  const ctx = { module: mod, fn, requestId }

  return {
    timer,
    ctx,
    logReq: (extra = {}) =>
      logRequest({ method, url, requestId, userId, module: mod, fn, ...extra }),
    logRes: (extra = {}) =>
      logResponse({ method, url, requestId, module: mod, fn, duration: timer.stop(), ...extra }),
    logErr: (error, extra = {}) =>
      logError({ error, method, url, requestId, userId, module: mod, fn, ...extra }),
    logQ: (extra) =>
      logQuery({ requestId, module: mod, fn, ...extra }),
  }
}

export { logRequest, logResponse, logError, logQuery, logAuth, logPerformance, createRequestLogger }
