/**
 * @fileoverview Execution time measurement utilities for the Developer Debug Toolkit.
 * Provides lightweight async-compatible timers and function wrappers.
 *
 * @module debug/timer
 */

import { logger } from './logger.js'
import { formatDuration } from './formatter.js'

// ─── startTimer ───────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Timer
 * @property {() => number} stop   - Stops the timer and returns elapsed ms
 * @property {() => string} format - Stops the timer and returns a formatted string
 */

/**
 * Creates a high-resolution timer.
 * Uses `performance.now()` when available, falls back to `Date.now()`.
 *
 * @returns {Timer}
 *
 * @example
 * const timer = startTimer()
 * await someAsyncOperation()
 * const ms = timer.stop()
 * logger.info('Done', { duration: ms })
 *
 * // Or get a human-readable string directly:
 * const label = timer.format()  // e.g. '45ms' or '1.23s'
 */
function startTimer() {
  const start =
    typeof performance !== 'undefined' ? performance.now() : Date.now()

  return {
    stop() {
      const end =
        typeof performance !== 'undefined' ? performance.now() : Date.now()
      return Math.round(end - start)
    },
    format() {
      const end =
        typeof performance !== 'undefined' ? performance.now() : Date.now()
      return formatDuration(Math.round(end - start))
    },
  }
}

// ─── withTimer ────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} TimedResult
 * @template T
 * @property {T}      result   - The resolved value of the async function
 * @property {number} duration - Elapsed time in milliseconds
 * @property {string} label    - Human-readable duration string
 */

/**
 * Wraps any async function, measures its execution time, and logs the result.
 * On success → logs at `success` level. On error → logs at `error` level and re-throws.
 *
 * @template T
 * @param {string}   label  - Human-readable name for the operation
 * @param {() => Promise<T>} fn - The async function to execute
 * @param {import('./logger.js').LogContext} [ctx] - Optional log context
 * @returns {Promise<TimedResult<T>>}
 *
 * @example
 * const { result, duration } = await withTimer(
 *   'Fetch user profile',
 *   () => supabase.from('profiles').select('*').eq('id', userId).single(),
 *   { module: 'dashboard/users/page', fn: 'fetchData', requestId }
 * )
 */
async function withTimer(label, fn, ctx = {}) {
  const timer = startTimer()

  logger.debug(`⏱️  Starting: ${label}`, { ...ctx })

  try {
    const result = await fn()
    const duration = timer.stop()

    logger.success(`⏱️  Completed: ${label}`, {
      ...ctx,
      duration,
    })

    return { result, duration, label: formatDuration(duration) }
  } catch (err) {
    const duration = timer.stop()

    logger.error(`⏱️  Failed: ${label} (after ${formatDuration(duration)})`, {
      ...ctx,
      duration,
      data: err,
    })

    throw err
  }
}

// ─── measureAll ───────────────────────────────────────────────────────────────

/**
 * Runs multiple named async operations in sequence and logs each individually.
 * Returns an array of results in the same order as the input.
 *
 * @template T
 * @param {Array<{ label: string; fn: () => Promise<T>; ctx?: import('./logger.js').LogContext }>} operations
 * @returns {Promise<Array<TimedResult<T>>>}
 *
 * @example
 * const [usersResult, ordersResult] = await measureAll([
 *   { label: 'Fetch users', fn: () => supabase.from('profiles').select('*') },
 *   { label: 'Fetch orders', fn: () => supabase.from('orders').select('*') },
 * ])
 */
async function measureAll(operations) {
  const results = []
  for (const op of operations) {
    // eslint-disable-next-line no-await-in-loop
    const result = await withTimer(op.label, op.fn, op.ctx ?? {})
    results.push(result)
  }
  return results
}

// ─── createPerfMark ──────────────────────────────────────────────────────────

/**
 * Returns a simple performance mark object for manual timing sections.
 * Useful when you can't wrap everything in withTimer.
 *
 * @param {string} name
 * @returns {{ name: string; startedAt: number; mark: (label: string) => void }}
 *
 * @example
 * const perf = createPerfMark('API /orders')
 * // ... step 1 ...
 * perf.mark('after db query')
 * // ... step 2 ...
 * perf.mark('after format')
 */
function createPerfMark(name) {
  const startedAt = Date.now()
  let lastMark = startedAt

  return {
    name,
    startedAt,
    mark(label) {
      const now = Date.now()
      const sinceStart = now - startedAt
      const sinceLast = now - lastMark
      lastMark = now
      logger.debug(
        `📍 [${name}] ${label} — +${formatDuration(sinceLast)} (total: ${formatDuration(sinceStart)})`,
      )
    },
  }
}

export { startTimer, withTimer, measureAll, createPerfMark }
