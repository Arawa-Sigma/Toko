/**
 * @fileoverview Core logger for the Developer Debug Toolkit.
 * Supports 8 log levels with ANSI colors, timestamps, file/function context,
 * request ID tracking, request grouping, and deduplication.
 *
 * @module debug/logger
 */

// ─── Environment Guards ───────────────────────────────────────────────────────

const IS_SERVER = typeof window === 'undefined'
const IS_DEV = process.env.NODE_ENV === 'development'
const DEBUG_ENABLED = process.env.DEBUG === 'true'
const LOGS_DISABLED = process.env.DISABLE_LOGS === 'true'

/**
 * Log levels in ascending priority order.
 * @enum {number}
 */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  success: 2,
  api: 3,
  database: 4,
  auth: 5,
  warning: 6,
  error: 7,
}

/** @type {number} Minimum level to emit; controlled by LOG_LEVEL env var */
const MIN_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LOG_LEVELS.debug

// ─── ANSI Colors (server-side only) ──────────────────────────────────────────

/** @type {Record<string, string>} ANSI escape codes for terminal colors */
const ANSI = IS_SERVER
  ? {
      reset: '\x1b[0m',
      bold: '\x1b[1m',
      dim: '\x1b[2m',
      // Foreground
      gray: '\x1b[90m',
      white: '\x1b[97m',
      cyan: '\x1b[36m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      red: '\x1b[31m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      brightBlue: '\x1b[94m',
      brightGreen: '\x1b[92m',
      brightYellow: '\x1b[93m',
      brightRed: '\x1b[91m',
      brightMagenta: '\x1b[95m',
      brightCyan: '\x1b[96m',
      // Background
      bgRed: '\x1b[41m',
      bgYellow: '\x1b[43m',
      bgGreen: '\x1b[42m',
      bgBlue: '\x1b[44m',
      bgMagenta: '\x1b[45m',
      bgCyan: '\x1b[46m',
    }
  : /** Client side: all empty strings */ Object.fromEntries(
      ['reset','bold','dim','gray','white','cyan','green','yellow','red','blue',
       'magenta','brightBlue','brightGreen','brightYellow','brightRed','brightMagenta',
       'brightCyan','bgRed','bgYellow','bgGreen','bgBlue','bgMagenta','bgCyan']
        .map((k) => [k, ''])
    )

// ─── Level Config ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} LevelConfig
 * @property {string} emoji     - Visual icon for readability
 * @property {string} label     - Padded label for alignment
 * @property {string} color     - ANSI color for the label/prefix
 * @property {string} msgColor  - ANSI color for the message body
 * @property {'log'|'info'|'warn'|'error'|'debug'} consoleFn - console method
 */

/** @type {Record<string, LevelConfig>} */
const LEVEL_CONFIG = {
  debug: {
    emoji: '🔍',
    label: 'DEBUG   ',
    color: ANSI.gray,
    msgColor: ANSI.dim,
    consoleFn: 'debug',
  },
  info: {
    emoji: 'ℹ️ ',
    label: 'INFO    ',
    color: ANSI.brightBlue,
    msgColor: ANSI.white,
    consoleFn: 'info',
  },
  success: {
    emoji: '✅',
    label: 'SUCCESS ',
    color: ANSI.brightGreen,
    msgColor: ANSI.green,
    consoleFn: 'log',
  },
  warning: {
    emoji: '⚠️ ',
    label: 'WARNING ',
    color: ANSI.brightYellow,
    msgColor: ANSI.yellow,
    consoleFn: 'warn',
  },
  error: {
    emoji: '❌',
    label: 'ERROR   ',
    color: ANSI.brightRed,
    msgColor: ANSI.red,
    consoleFn: 'error',
  },
  api: {
    emoji: '🌐',
    label: 'API     ',
    color: ANSI.brightCyan,
    msgColor: ANSI.cyan,
    consoleFn: 'log',
  },
  database: {
    emoji: '🗄️ ',
    label: 'DATABASE',
    color: ANSI.brightMagenta,
    msgColor: ANSI.magenta,
    consoleFn: 'log',
  },
  auth: {
    emoji: '🔐',
    label: 'AUTH    ',
    color: ANSI.brightYellow,
    msgColor: ANSI.yellow,
    consoleFn: 'log',
  },
}

// ─── Deduplication ────────────────────────────────────────────────────────────

/** @type {Map<string, number>} Map of recent log fingerprints → timestamp */
const _recentLogs = new Map()

/** Window (ms) within which duplicate logs are suppressed */
const DEDUP_WINDOW_MS = 10

/**
 * Returns true if this exact message was already emitted within DEDUP_WINDOW_MS.
 * @param {string} fingerprint
 * @returns {boolean}
 */
function _isDuplicate(fingerprint) {
  const now = Date.now()
  const last = _recentLogs.get(fingerprint)
  if (last && now - last < DEDUP_WINDOW_MS) return true
  _recentLogs.set(fingerprint, now)
  // Keep map from growing forever
  if (_recentLogs.size > 200) {
    const oldest = _recentLogs.keys().next().value
    _recentLogs.delete(oldest)
  }
  return false
}

// ─── Active Groups ────────────────────────────────────────────────────────────

/** @type {Set<string>} Currently open console groups (by requestId) */
const _openGroups = new Set()

// ─── Core Emit ────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} LogContext
 * @property {string}  [module]    - File or module name (e.g. 'dashboard/users/page')
 * @property {string}  [fn]        - Function name
 * @property {string}  [requestId] - Request ID from x-request-id header
 * @property {number}  [duration]  - Execution time in ms
 * @property {*}       [data]      - Additional data to pretty-print
 */

/**
 * Core log emission function.
 * @param {keyof typeof LOG_LEVELS} level
 * @param {string} message
 * @param {LogContext} [ctx]
 */
function _emit(level, message, ctx = {}) {
  // Environment gate
  if (LOGS_DISABLED) return
  if (!IS_DEV && !DEBUG_ENABLED) {
    // In production without DEBUG=true, only emit warning/error
    if (LOG_LEVELS[level] < LOG_LEVELS.warning) return
  }

  // Level gate
  if ((LOG_LEVELS[level] ?? 0) < MIN_LEVEL) return

  // Deduplication
  const fingerprint = `${level}|${message}|${ctx.requestId ?? ''}`
  if (_isDuplicate(fingerprint)) return

  const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.info
  const { R, B, D, G } = {
    R: ANSI.reset,
    B: ANSI.bold,
    D: ANSI.dim,
    G: ANSI.gray,
  }

  // ── Build prefix ──
  const ts = new Date().toISOString()
  const tsStr = `${D}${G}${ts}${R}`
  const levelStr = `${B}${cfg.color}${cfg.emoji} ${cfg.label}${R}`
  const moduleStr = ctx.module
    ? ` ${D}${G}[${ctx.module}${ctx.fn ? `:${ctx.fn}` : ''}]${R}`
    : ''
  const reqStr = ctx.requestId ? ` ${D}${G}req:${ctx.requestId.slice(0, 8)}${R}` : ''
  const durStr =
    ctx.duration != null
      ? ` ${D}${G}(${ctx.duration < 1000 ? `${ctx.duration}ms` : `${(ctx.duration / 1000).toFixed(2)}s`})${R}`
      : ''

  const prefix = `${tsStr} ${levelStr}${moduleStr}${reqStr}${durStr}`
  const msgStr = `${cfg.msgColor}${message}${R}`

  const consoleFn = console[cfg.consoleFn] ?? console.log

  // ── Emit ──
  if (ctx.data !== undefined) {
    consoleFn(`${prefix} ${msgStr}`, ctx.data)
  } else {
    consoleFn(`${prefix} ${msgStr}`)
  }
}

// ─── Public Logger API ────────────────────────────────────────────────────────

/**
 * The main logger object.
 * Each method accepts a message and an optional context.
 *
 * @example
 * logger.info('Server started', { module: 'server', fn: 'main' })
 * logger.error('Something broke', { module: 'api/orders', fn: 'POST', data: err })
 */
const logger = {
  /** @param {string} msg @param {LogContext} [ctx] */
  debug: (msg, ctx) => _emit('debug', msg, ctx),

  /** @param {string} msg @param {LogContext} [ctx] */
  info: (msg, ctx) => _emit('info', msg, ctx),

  /** @param {string} msg @param {LogContext} [ctx] */
  success: (msg, ctx) => _emit('success', msg, ctx),

  /** @param {string} msg @param {LogContext} [ctx] */
  warning: (msg, ctx) => _emit('warning', msg, ctx),

  /** @param {string} msg @param {LogContext} [ctx] */
  error: (msg, ctx) => _emit('error', msg, ctx),

  /** @param {string} msg @param {LogContext} [ctx] */
  api: (msg, ctx) => _emit('api', msg, ctx),

  /** @param {string} msg @param {LogContext} [ctx] */
  database: (msg, ctx) => _emit('database', msg, ctx),

  /** @param {string} msg @param {LogContext} [ctx] */
  auth: (msg, ctx) => _emit('auth', msg, ctx),

  /**
   * Open a named log group (visually groups related logs for one request).
   * Tracks open groups to avoid duplicates.
   * @param {string} groupName
   * @param {string} [requestId]
   */
  group: (groupName, requestId) => {
    if (LOGS_DISABLED) return
    if (!IS_DEV && !DEBUG_ENABLED) return
    const key = requestId ?? groupName
    if (_openGroups.has(key)) return
    _openGroups.add(key)
    const label = `${ANSI.bold}${ANSI.brightCyan}┌─ ${groupName}${requestId ? ` [${requestId.slice(0, 8)}]` : ''}${ANSI.reset}`
    console.group(label)
  },

  /**
   * Close a named log group.
   * @param {string} groupName
   * @param {string} [requestId]
   */
  groupEnd: (groupName, requestId) => {
    if (LOGS_DISABLED) return
    if (!IS_DEV && !DEBUG_ENABLED) return
    const key = requestId ?? groupName
    if (!_openGroups.has(key)) return
    _openGroups.delete(key)
    console.groupEnd()
    const label = `${ANSI.dim}${ANSI.gray}└─ end: ${groupName}${ANSI.reset}`
    console.debug(label)
  },

  /**
   * Print a horizontal separator rule for visual clarity.
   * @param {string} [label]
   */
  separator: (label = '') => {
    if (LOGS_DISABLED) return
    if (!IS_DEV && !DEBUG_ENABLED) return
    const line = '─'.repeat(60)
    const text = label ? ` ${label} ` : ''
    console.log(`${ANSI.dim}${ANSI.gray}${line}${text}${ANSI.reset}`)
  },
}

export { logger, LOG_LEVELS, LEVEL_CONFIG, ANSI, IS_DEV, DEBUG_ENABLED, LOGS_DISABLED }
