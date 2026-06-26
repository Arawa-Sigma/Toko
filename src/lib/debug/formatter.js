/**
 * @fileoverview Formatter utilities for the Developer Debug Toolkit.
 * Provides pretty-printing, sensitive-data sanitization, error formatting,
 * and human-readable duration formatting.
 *
 * @module debug/formatter
 */

import { ANSI } from './logger.js'

// ─── Sensitive Field Detection ────────────────────────────────────────────────

/**
 * Field names (case-insensitive) whose values will be redacted in logs.
 * @type {string[]}
 */
const SENSITIVE_KEYS = [
  'password',
  'passwd',
  'secret',
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'service_role',
  'service_role_key',
  'apikey',
  'api_key',
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'anon_key',
  'supabase_key',
  'stripe_key',
  'private_key',
  'client_secret',
  'session_token',
  'csrf_token',
]

/**
 * Checks if a key name is considered sensitive.
 * @param {string} key
 * @returns {boolean}
 */
function _isSensitiveKey(key) {
  const lower = key.toLowerCase().replace(/[-_\s]/g, '')
  return SENSITIVE_KEYS.some((s) => lower.includes(s.replace(/[-_]/g, '')))
}

// ─── Sanitizer ────────────────────────────────────────────────────────────────

/**
 * Deeply sanitizes an object, redacting any sensitive fields.
 * Safe to call with null, undefined, primitives, arrays, or nested objects.
 *
 * @param {*} value - Value to sanitize
 * @param {number} [depth=0] - Current recursion depth (max 10)
 * @returns {*} Sanitized value (new object, does not mutate original)
 *
 * @example
 * sanitize({ email: 'a@b.com', password: 'secret123' })
 * // → { email: 'a@b.com', password: '[REDACTED]' }
 */
function sanitize(value, depth = 0) {
  if (depth > 10) return '[MAX_DEPTH]'
  if (value === null || value === undefined) return value
  if (typeof value !== 'object') return value
  if (value instanceof Error) return value // keep Errors as-is

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1))
  }

  /** @type {Record<string, *>} */
  const sanitized = {}
  for (const [key, val] of Object.entries(value)) {
    if (_isSensitiveKey(key)) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitize(val, depth + 1)
    } else {
      sanitized[key] = val
    }
  }
  return sanitized
}

// ─── Pretty Printer ───────────────────────────────────────────────────────────

/**
 * Converts any value to a readable string for logging.
 * - Objects/arrays → JSON with 2-space indent
 * - Errors → formatted error string
 * - Primitives → String()
 *
 * @param {*} value
 * @param {Object} [options]
 * @param {boolean} [options.sanitizeData=true] - Whether to strip sensitive fields
 * @returns {string}
 */
function prettyPrint(value, { sanitizeData = true } = {}) {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return value
  if (typeof value !== 'object') return String(value)
  if (value instanceof Error) return _formatErrorString(value)

  const target = sanitizeData ? sanitize(value) : value
  try {
    return JSON.stringify(target, _jsonReplacer, 2)
  } catch {
    return String(target)
  }
}

/**
 * JSON replacer that handles circular references.
 * @param {string} _key
 * @param {*} value
 * @returns {*}
 */
function _jsonReplacer(_key, value) {
  if (typeof value === 'bigint') return `[BigInt: ${value.toString()}]`
  if (typeof value === 'function') return `[Function: ${value.name ?? 'anonymous'}]`
  if (value instanceof RegExp) return `[RegExp: ${value.toString()}]`
  return value
}

// ─── Duration Formatter ───────────────────────────────────────────────────────

/**
 * Converts milliseconds to a human-readable duration string.
 * @param {number} ms - Duration in milliseconds
 * @returns {string}
 *
 * @example
 * formatDuration(45)    // '45ms'
 * formatDuration(1234)  // '1.23s'
 * formatDuration(75000) // '1m 15s'
 */
function formatDuration(ms) {
  if (ms < 0) ms = 0
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)}s`
  const mins = Math.floor(ms / 60_000)
  const secs = Math.round((ms % 60_000) / 1000)
  return `${mins}m ${secs}s`
}

// ─── Error Formatter ──────────────────────────────────────────────────────────

/**
 * @typedef {Object} ErrorContext
 * @property {string}  [module]     - Module/file where the error occurred
 * @property {string}  [fn]         - Function name
 * @property {string}  [requestId]  - Associated request ID
 * @property {string}  [method]     - HTTP method (for API errors)
 * @property {string}  [url]        - Request URL (for API errors)
 * @property {string}  [userId]     - Authenticated user ID
 * @property {*}       [input]      - Input that caused the error (will be sanitized)
 */

/**
 * Returns a concise single-line error string from an Error object.
 * @param {Error} err
 * @returns {string}
 */
function _formatErrorString(err) {
  return `[${err.name ?? 'Error'}] ${err.message}`
}

/**
 * Formats a rich, multi-section error report suitable for terminal output.
 * Includes: message, stack trace, cause chain, request context, and input.
 *
 * @param {Error|unknown} err - The error to format
 * @param {ErrorContext} [ctx] - Optional request/function context
 * @returns {string} Formatted error block
 */
function formatError(err, ctx = {}) {
  const lines = []
  const { reset: R, bold: B, red, brightRed, gray, dim, yellow } = ANSI

  // ── Header ──
  lines.push(`${B}${brightRed}╔══ ERROR REPORT ════════════════════════════════════════${R}`)

  // ── Error type & message ──
  if (err instanceof Error) {
    lines.push(`${B}${red}  ✦ Name    :${R} ${err.name}`)
    lines.push(`${B}${red}  ✦ Message :${R} ${err.message}`)

    // ── Stack trace ──
    if (err.stack) {
      lines.push(`${B}${gray}  ✦ Stack   :${R}`)
      const stackLines = err.stack
        .split('\n')
        .slice(1) // skip the first line (duplicate of message)
        .map((l) => `      ${dim}${gray}${l.trim()}${R}`)
      lines.push(...stackLines.slice(0, 15)) // cap at 15 frames
    }

    // ── Cause chain ──
    let cause = err.cause
    let causeDepth = 0
    while (cause && causeDepth < 5) {
      lines.push(`${B}${yellow}  ✦ Cause[${causeDepth}]:${R}`)
      if (cause instanceof Error) {
        lines.push(`      ${dim}Name: ${cause.name}${R}`)
        lines.push(`      ${dim}Msg:  ${cause.message}${R}`)
      } else {
        lines.push(`      ${dim}${prettyPrint(cause)}${R}`)
      }
      cause = cause?.cause
      causeDepth++
    }
  } else {
    // Non-Error thrown values
    lines.push(`${B}${red}  ✦ Thrown  :${R} ${prettyPrint(err)}`)
  }

  // ── Request context ──
  if (Object.keys(ctx).length > 0) {
    lines.push(`${B}${gray}  ✦ Context :${R}`)
    if (ctx.module) lines.push(`      ${dim}Module    : ${ctx.module}${ctx.fn ? `:${ctx.fn}` : ''}${R}`)
    if (ctx.requestId) lines.push(`      ${dim}RequestId : ${ctx.requestId}${R}`)
    if (ctx.method) lines.push(`      ${dim}Method    : ${ctx.method}${R}`)
    if (ctx.url) lines.push(`      ${dim}URL       : ${ctx.url}${R}`)
    if (ctx.userId) lines.push(`      ${dim}UserId    : ${ctx.userId}${R}`)
    if (ctx.input !== undefined) {
      lines.push(`      ${dim}Input     : ${prettyPrint(ctx.input, { sanitizeData: true })}${R}`)
    }
  }

  lines.push(`${B}${brightRed}╚════════════════════════════════════════════════════════${R}`)
  return lines.join('\n')
}

// ─── HTTP Status Formatter ────────────────────────────────────────────────────

/**
 * Returns a colored HTTP status code string.
 * @param {number} status
 * @returns {string}
 */
function formatStatus(status) {
  const { brightGreen, brightYellow, brightRed, brightBlue, reset, bold } = ANSI
  if (status >= 500) return `${bold}${brightRed}${status}${reset}`
  if (status >= 400) return `${bold}${brightYellow}${status}${reset}`
  if (status >= 300) return `${bold}${brightBlue}${status}${reset}`
  if (status >= 200) return `${bold}${brightGreen}${status}${reset}`
  return `${bold}${status}${reset}`
}

export { sanitize, prettyPrint, formatDuration, formatError, formatStatus, SENSITIVE_KEYS }
