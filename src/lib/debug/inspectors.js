/**
 * @fileoverview Inspector utilities for the Developer Debug Toolkit.
 * Provides safe introspection of cookies, headers, sessions, and environment variables.
 * All sensitive values are redacted before logging.
 *
 * @module debug/inspectors
 */

import { logger } from './logger.js'
import { sanitize } from './formatter.js'
import { ANSI, IS_DEV, DEBUG_ENABLED } from './logger.js'

// ─── Guard ────────────────────────────────────────────────────────────────────

/**
 * Returns true if inspection output should be shown.
 * @returns {boolean}
 */
function _shouldInspect() {
  return IS_DEV || DEBUG_ENABLED
}

// ─── inspectCookies ───────────────────────────────────────────────────────────

/**
 * @typedef {Object} CookieInspectOptions
 * @property {import('next/headers').ReadonlyRequestCookies | Map<string,{name:string,value:string}>} cookieStore
 * - The cookie store from `await cookies()` (Next.js) or any iterable cookies object
 * @property {string} [module]    - File/module name for log context
 * @property {string} [fn]        - Function name for log context
 * @property {string} [requestId] - Request ID for log context
 */

/**
 * Logs all cookie names and a safe preview of their values.
 * Sensitive cookies (e.g. auth tokens) have their values replaced with [REDACTED].
 *
 * @param {CookieInspectOptions} options
 *
 * @example
 * // In a Server Component or Route Handler:
 * import { cookies } from 'next/headers'
 * import { inspectCookies } from '@/lib/debug'
 *
 * const cookieStore = await cookies()
 * inspectCookies({ cookieStore, module: 'dashboard/layout' })
 */
function inspectCookies({ cookieStore, module: mod, fn, requestId }) {
  if (!_shouldInspect()) return

  const { dim, gray, bold, brightCyan, reset } = ANSI
  let allCookies = []

  try {
    // Support Next.js ReadonlyRequestCookies (.getAll()) and plain arrays
    if (typeof cookieStore?.getAll === 'function') {
      allCookies = cookieStore.getAll()
    } else if (Symbol.iterator in Object(cookieStore)) {
      allCookies = Array.from(cookieStore)
    }
  } catch {
    logger.warning('inspectCookies: could not iterate cookie store', { module: mod, fn, requestId })
    return
  }

  logger.debug(`🍪 Cookies (${allCookies.length})`, { module: mod, fn, requestId })

  for (const cookie of allCookies) {
    const name = cookie.name ?? cookie[0] ?? '?'
    const rawValue = cookie.value ?? cookie[1] ?? ''

    // Sanitize: redact sensitive cookie names
    const isSensitive =
      name.toLowerCase().includes('token') ||
      name.toLowerCase().includes('session') ||
      name.toLowerCase().includes('auth') ||
      name.toLowerCase().includes('sb-') ||
      name.toLowerCase().includes('supabase') ||
      name.startsWith('__Secure-') ||
      name.startsWith('__Host-')

    const displayValue = isSensitive
      ? '[REDACTED]'
      : rawValue.length > 40
        ? `${rawValue.slice(0, 40)}…`
        : rawValue

    console.debug(
      `  ${bold}${brightCyan}${name}${reset}${dim}${gray}: ${isSensitive ? '[REDACTED]' : displayValue}${reset}`,
    )
  }
}

// ─── inspectHeaders ───────────────────────────────────────────────────────────

/**
 * @typedef {Object} HeaderInspectOptions
 * @property {import('next/headers').ReadonlyHeaders | Headers | Record<string,string>} headers
 * - The headers object (from `await headers()`, `request.headers`, or a plain object)
 * @property {string} [module]    - File/module name
 * @property {string} [fn]        - Function name
 * @property {string} [requestId] - Request ID
 */

/**
 * Logs all request/response headers with sensitive values masked.
 * Masked headers: authorization, cookie, set-cookie, x-api-key, x-auth-token.
 *
 * @param {HeaderInspectOptions} options
 *
 * @example
 * import { headers } from 'next/headers'
 * const headerStore = await headers()
 * inspectHeaders({ headers: headerStore, module: 'dashboard/layout' })
 */
function inspectHeaders({ headers, module: mod, fn, requestId }) {
  if (!_shouldInspect()) return

  const { dim, gray, bold, brightCyan, reset } = ANSI
  let entries = []

  try {
    if (typeof headers?.entries === 'function') {
      entries = Array.from(headers.entries())
    } else if (typeof headers === 'object') {
      entries = Object.entries(headers)
    }
  } catch {
    logger.warning('inspectHeaders: could not iterate headers', { module: mod, fn, requestId })
    return
  }

  // Sanitize the headers object
  const sanitized = sanitize(Object.fromEntries(entries))

  logger.debug(`📋 Headers (${entries.length})`, { module: mod, fn, requestId })

  for (const [key, value] of Object.entries(sanitized)) {
    const displayValue =
      typeof value === 'string' && value.length > 80
        ? `${value.slice(0, 80)}…`
        : value

    console.debug(`  ${bold}${brightCyan}${key}${reset}${dim}${gray}: ${displayValue}${reset}`)
  }
}

// ─── inspectSession ───────────────────────────────────────────────────────────

/**
 * @typedef {Object} SessionInspectOptions
 * @property {import('@supabase/supabase-js').SupabaseClient} supabase
 * - Initialized Supabase client (browser or server)
 * @property {string} [module]    - File/module name
 * @property {string} [fn]        - Function name
 * @property {string} [requestId] - Request ID
 */

/**
 * Inspects and logs the current Supabase session (server or client).
 * Logs: user ID, email (partially masked), role, and token expiry.
 * Never logs raw access/refresh tokens.
 *
 * @param {SessionInspectOptions} options
 * @returns {Promise<import('@supabase/supabase-js').Session | null>}
 *
 * @example
 * const supabase = await createClient() // server
 * await inspectSession({ supabase, module: 'dashboard/layout' })
 */
async function inspectSession({ supabase, module: mod, fn, requestId }) {
  if (!_shouldInspect()) return null

  const { dim, gray, bold, brightGreen, brightRed, reset } = ANSI

  let session = null
  let user = null

  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      logger.auth(`🔐 Session: ❌ ${error.message}`, { module: mod, fn, requestId })
      return null
    }
    session = data?.session
    user = session?.user
  } catch (err) {
    logger.auth('🔐 Session: ❌ Failed to retrieve', { module: mod, fn, requestId, data: err })
    return null
  }

  if (!user) {
    logger.auth(
      `🔐 Session: ${bold}${brightRed}Not authenticated${reset}`,
      { module: mod, fn, requestId },
    )
    return null
  }

  // Partially mask email: a***@domain.com
  const maskedEmail = user.email
    ? user.email.replace(/^(.{1,3}).*@/, '$1***@')
    : 'N/A'

  // Format token expiry
  const expiresAt = session?.expires_at
  const expiresStr = expiresAt
    ? new Date(expiresAt * 1000).toISOString()
    : 'N/A'

  logger.auth(
    `🔐 Session: ${bold}${brightGreen}Authenticated${reset}`,
    { module: mod, fn, requestId },
  )
  console.debug(`  ${dim}${gray}User ID   :${reset} ${bold}${user.id}${reset}`)
  console.debug(`  ${dim}${gray}Email     :${reset} ${maskedEmail}`)
  console.debug(`  ${dim}${gray}Role      :${reset} ${user.role ?? 'authenticated'}`)
  console.debug(`  ${dim}${gray}Provider  :${reset} ${user.app_metadata?.provider ?? 'unknown'}`)
  console.debug(`  ${dim}${gray}Expires At:${reset} ${expiresStr}`)

  return session
}

// ─── inspectEnvironment ───────────────────────────────────────────────────────

/**
 * Required environment variables for the SembakoBerkah project.
 * Values are never logged — only presence/absence is indicated.
 * @type {string[]}
 */
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NODE_ENV',
]

/**
 * Optional env vars that are good to have.
 * @type {string[]}
 */
const OPTIONAL_ENV_VARS = [
  'DEBUG',
  'LOG_LEVEL',
  'DISABLE_LOGS',
]

/**
 * Inspects and logs the presence/absence of critical environment variables.
 * Never logs actual values.
 *
 * @param {object} [options]
 * @param {string[]} [options.extra]     - Additional variable names to check
 * @param {string}   [options.module]    - File/module name
 * @param {string}   [options.fn]        - Function name
 * @param {string}   [options.requestId] - Request ID
 *
 * @example
 * // In a Server Component or server-side startup:
 * inspectEnvironment({ module: 'lib/supabaseServer' })
 */
function inspectEnvironment({ extra = [], module: mod, fn, requestId } = {}) {
  if (!_shouldInspect()) return

  const { dim, gray, bold, brightGreen, brightRed, brightYellow, reset } = ANSI
  const allVars = [
    ...REQUIRED_ENV_VARS.map((v) => ({ name: v, required: true })),
    ...OPTIONAL_ENV_VARS.map((v) => ({ name: v, required: false })),
    ...extra.map((v) => ({ name: v, required: false })),
  ]

  logger.debug(`🌍 Environment (${process.env.NODE_ENV})`, { module: mod, fn, requestId })

  for (const { name, required } of allVars) {
    const exists = process.env[name] !== undefined && process.env[name] !== ''
    const statusEmoji = exists ? '✅' : required ? '❌' : '⬜'
    const statusColor = exists ? brightGreen : required ? brightRed : brightYellow
    const label = required ? 'required' : 'optional'

    console.debug(
      `  ${statusEmoji} ${bold}${statusColor}${name}${reset}${dim}${gray} [${label}]: ${exists ? 'SET' : 'NOT SET'}${reset}`,
    )
  }
}

export { inspectCookies, inspectHeaders, inspectSession, inspectEnvironment }
