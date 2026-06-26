/**
 * @fileoverview Supabase-specific debug wrappers for the Developer Debug Toolkit.
 * Provides transparent query logging, auth event tracking, and realtime logging.
 *
 * @module debug/supabase
 */

import { logger } from './logger.js'
import { logQuery, logAuth } from './helpers.js'
import { sanitize, prettyPrint } from './formatter.js'
import { startTimer } from './timer.js'
import { IS_DEV, DEBUG_ENABLED } from './logger.js'

// ─── createDebugClient ────────────────────────────────────────────────────────

/**
 * @typedef {Object} DebugClientOptions
 * @property {string} [module]    - File/module name for log context
 * @property {string} [fn]        - Function name for log context
 * @property {string} [requestId] - Request ID for log context
 */

/**
 * Wraps a Supabase client with transparent debug logging.
 * Intercepts `.from()`, `.rpc()`, and `.auth` calls to log:
 * - SELECT, INSERT, UPDATE, DELETE, UPSERT, RPC operations
 * - Table name, filters, row count, duration, and errors
 * - Auth state events
 *
 * The original client is returned (with method overrides on the proxy).
 * In production (without DEBUG=true), the original client is returned as-is.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {DebugClientOptions} [ctx]
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 *
 * @example
 * // In a Server Component or Route Handler:
 * import { createClient } from '@/lib/supabaseServer'
 * import { createDebugClient } from '@/lib/debug'
 *
 * const supabase = createDebugClient(await createClient(), {
 *   module: 'api/orders/route',
 *   fn: 'GET',
 *   requestId,
 * })
 *
 * // From this point, all .from() calls are automatically logged
 * const { data } = await supabase.from('orders').select('*').eq('status', 'pending')
 */
function createDebugClient(supabaseClient, ctx = {}) {
  if (!IS_DEV && !DEBUG_ENABLED) return supabaseClient

  const { module: mod, fn, requestId } = ctx

  // ── Wrap .from() ──
  const originalFrom = supabaseClient.from.bind(supabaseClient)

  supabaseClient.from = function debugFrom(table) {
    const queryBuilder = originalFrom(table)
    return _wrapQueryBuilder(queryBuilder, table, { module: mod, fn, requestId })
  }

  // ── Wrap .rpc() ──
  if (typeof supabaseClient.rpc === 'function') {
    const originalRpc = supabaseClient.rpc.bind(supabaseClient)
    supabaseClient.rpc = function debugRpc(fnName, args, options) {
      const timer = startTimer()
      const result = originalRpc(fnName, args, options)

      // .rpc() returns a PostgrestFilterBuilder — wrap its then()
      const originalThen = result.then?.bind(result)
      if (originalThen) {
        result.then = function (resolve, reject) {
          return originalThen(
            (res) => {
              const duration = timer.stop()
              logQuery({
                operation: 'RPC',
                table: fnName,
                filter: sanitize(args ?? {}),
                duration,
                rowCount: Array.isArray(res?.data) ? res.data.length : res?.data != null ? 1 : 0,
                error: res?.error ?? null,
                requestId,
                module: mod,
                fn,
              })
              return resolve ? resolve(res) : res
            },
            (err) => {
              logQuery({
                operation: 'RPC',
                table: fnName,
                error: err,
                requestId,
                module: mod,
                fn,
              })
              return reject ? reject(err) : Promise.reject(err)
            },
          )
        }
      }
      return result
    }
  }

  return supabaseClient
}

// ─── Query Builder Proxy ──────────────────────────────────────────────────────

/**
 * Wraps a Supabase query builder (from `.from(table)`) to intercept
 * the terminal methods (select, insert, update, delete, upsert) and log them.
 *
 * @param {*} qb        - The query builder from supabase.from(table)
 * @param {string} table - Table name
 * @param {DebugClientOptions} ctx
 * @returns {*}          - The same query builder with logging hooks
 */
function _wrapQueryBuilder(qb, table, ctx) {
  const { module: mod, fn: fnName, requestId } = ctx

  /**
   * Intercepts a terminal method call and wraps it to log after resolution.
   * @param {'SELECT'|'INSERT'|'UPDATE'|'DELETE'|'UPSERT'} operation
   * @param {Function} originalMethod
   * @param {...*} args - Arguments passed to the original method
   * @returns {*}
   */
  function _intercept(operation, originalMethod, ...args) {
    const timer = startTimer()
    const result = originalMethod(...args)
    if (!result || typeof result.then !== 'function') return result

    const originalThen = result.then.bind(result)
    result.then = function (resolve, reject) {
      return originalThen(
        (res) => {
          const duration = timer.stop()
          const rowCount = Array.isArray(res?.data)
            ? res.data.length
            : res?.data != null
              ? 1
              : 0

          // Sanitize write data (INSERT/UPDATE/UPSERT)
          const sanitizedData =
            operation !== 'SELECT' && args[0] !== undefined
              ? sanitize(args[0])
              : undefined

          logQuery({
            operation,
            table,
            duration,
            rowCount,
            data: sanitizedData,
            error: res?.error ?? null,
            requestId,
            module: mod,
            fn: fnName,
          })

          return resolve ? resolve(res) : res
        },
        (err) => {
          logQuery({
            operation,
            table,
            error: err,
            requestId,
            module: mod,
            fn: fnName,
          })
          return reject ? reject(err) : Promise.reject(err)
        },
      )
    }
    return result
  }

  // Override select
  const origSelect = qb.select?.bind(qb)
  if (origSelect) {
    qb.select = function (...args) {
      const newQb = origSelect(...args)
      return _wrapSelectResult(newQb, table, ctx)
    }
  }

  // Override insert
  const origInsert = qb.insert?.bind(qb)
  if (origInsert) {
    qb.insert = function (...args) {
      return _intercept('INSERT', origInsert, ...args)
    }
  }

  // Override update
  const origUpdate = qb.update?.bind(qb)
  if (origUpdate) {
    qb.update = function (...args) {
      const newQb = origUpdate(...args)
      return _wrapUpdateResult(newQb, 'UPDATE', table, args[0], ctx)
    }
  }

  // Override delete
  const origDelete = qb.delete?.bind(qb)
  if (origDelete) {
    qb.delete = function (...args) {
      const newQb = origDelete(...args)
      return _wrapUpdateResult(newQb, 'DELETE', table, undefined, ctx)
    }
  }

  // Override upsert
  const origUpsert = qb.upsert?.bind(qb)
  if (origUpsert) {
    qb.upsert = function (...args) {
      return _intercept('UPSERT', origUpsert, ...args)
    }
  }

  return qb
}

/**
 * Wraps the result of a .select() chain to intercept promise resolution.
 * @param {*} qb
 * @param {string} table
 * @param {DebugClientOptions} ctx
 * @returns {*}
 */
function _wrapSelectResult(qb, table, ctx) {
  const timer = startTimer()
  const { module: mod, fn: fnName, requestId } = ctx

  if (!qb || typeof qb.then !== 'function') return qb

  const originalThen = qb.then.bind(qb)
  qb.then = function (resolve, reject) {
    return originalThen(
      (res) => {
        const duration = timer.stop()
        logQuery({
          operation: 'SELECT',
          table,
          duration,
          rowCount: Array.isArray(res?.data) ? res.data.length : res?.data != null ? 1 : 0,
          error: res?.error ?? null,
          requestId,
          module: mod,
          fn: fnName,
        })
        return resolve ? resolve(res) : res
      },
      (err) => {
        logQuery({ operation: 'SELECT', table, error: err, requestId, module: mod, fn: fnName })
        return reject ? reject(err) : Promise.reject(err)
      },
    )
  }
  return qb
}

/**
 * Wraps the result of an .update() or .delete() chain to intercept resolution.
 * @param {*} qb
 * @param {'UPDATE'|'DELETE'} operation
 * @param {string} table
 * @param {*} data
 * @param {DebugClientOptions} ctx
 * @returns {*}
 */
function _wrapUpdateResult(qb, operation, table, data, ctx) {
  const timer = startTimer()
  const { module: mod, fn: fnName, requestId } = ctx

  if (!qb || typeof qb.then !== 'function') return qb

  const originalThen = qb.then.bind(qb)
  qb.then = function (resolve, reject) {
    return originalThen(
      (res) => {
        const duration = timer.stop()
        logQuery({
          operation,
          table,
          duration,
          rowCount: Array.isArray(res?.data) ? res.data.length : res?.data != null ? 1 : 0,
          data: data !== undefined ? sanitize(data) : undefined,
          error: res?.error ?? null,
          requestId,
          module: mod,
          fn: fnName,
        })
        return resolve ? resolve(res) : res
      },
      (err) => {
        logQuery({ operation, table, error: err, requestId, module: mod, fn: fnName })
        return reject ? reject(err) : Promise.reject(err)
      },
    )
  }
  return qb
}

// ─── logSupabaseAuth ──────────────────────────────────────────────────────────

/**
 * Logs a Supabase Auth state change event.
 * To be used inside `supabase.auth.onAuthStateChange()`.
 *
 * @param {string} event     - Auth event string (e.g. 'SIGNED_IN')
 * @param {import('@supabase/supabase-js').Session | null} session - Current session
 * @param {DebugClientOptions} [ctx] - Optional log context
 *
 * @example
 * supabase.auth.onAuthStateChange((event, session) => {
 *   logSupabaseAuth(event, session, { module: 'components/AuthProvider' })
 * })
 */
function logSupabaseAuth(event, session, ctx = {}) {
  if (!IS_DEV && !DEBUG_ENABLED) return

  logAuth({
    event,
    userId: session?.user?.id,
    email: session?.user?.email,
    role: session?.user?.app_metadata?.role ?? session?.user?.role,
    provider: session?.user?.app_metadata?.provider,
    requestId: ctx.requestId,
    module: ctx.module,
    fn: ctx.fn,
  })

  // Log token expiry details at debug level
  if (session?.expires_at) {
    const expiresIn = Math.round((session.expires_at * 1000 - Date.now()) / 1000)
    logger.debug(`🔐 Token expires in ${expiresIn}s (${new Date(session.expires_at * 1000).toISOString()})`, {
      module: ctx.module,
      fn: ctx.fn,
      requestId: ctx.requestId,
    })
  }
}

// ─── logRealtimeEvent ─────────────────────────────────────────────────────────

/**
 * Logs a Supabase Realtime subscription event.
 *
 * @param {string} channel - Channel name (e.g. 'public:orders')
 * @param {string} event   - Postgres event type ('INSERT', 'UPDATE', 'DELETE', or '*')
 * @param {*}      payload - The event payload from Supabase realtime
 * @param {DebugClientOptions} [ctx]
 *
 * @example
 * const channel = supabase
 *   .channel('orders-changes')
 *   .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
 *     logRealtimeEvent('orders-changes', payload.eventType, payload, { module: 'components/OrdersList' })
 *   })
 *   .subscribe()
 */
function logRealtimeEvent(channel, event, payload, ctx = {}) {
  if (!IS_DEV && !DEBUG_ENABLED) return

  const table = payload?.table ?? '?'
  const schema = payload?.schema ?? 'public'
  const newRecord = payload?.new ? sanitize(payload.new) : undefined
  const oldRecord = payload?.old ? sanitize(payload.old) : undefined

  logger.database(
    `📡 REALTIME ${event} on ${schema}.${table} via [${channel}]`,
    {
      module: ctx.module,
      fn: ctx.fn,
      requestId: ctx.requestId,
      data: {
        ...(newRecord ? { new: newRecord } : {}),
        ...(oldRecord ? { old: oldRecord } : {}),
      },
    },
  )
}

// ─── subscribeWithLogging ──────────────────────────────────────────────────────

/**
 * Creates a Supabase Realtime subscription with automatic event logging.
 * Returns the channel so you can unsubscribe later.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} options
 * @param {string} options.channelName   - Unique channel name
 * @param {string} options.table         - Table to subscribe to
 * @param {string} [options.schema]      - Schema (default: 'public')
 * @param {'INSERT'|'UPDATE'|'DELETE'|'*'} [options.event] - Event type (default: '*')
 * @param {(payload: *) => void} options.onEvent - Callback for each event
 * @param {DebugClientOptions} [options.ctx]
 * @returns {import('@supabase/supabase-js').RealtimeChannel}
 *
 * @example
 * const channel = subscribeWithLogging(supabase, {
 *   channelName: 'orders-live',
 *   table: 'orders',
 *   onEvent: (payload) => console.log('New order:', payload),
 *   ctx: { module: 'dashboard/orders/page' }
 * })
 *
 * // Cleanup:
 * // supabase.removeChannel(channel)
 */
function subscribeWithLogging(supabase, { channelName, table, schema = 'public', event = '*', onEvent, ctx = {} }) {
  if (!IS_DEV && !DEBUG_ENABLED) {
    // In production, subscribe without logging overhead
    return supabase
      .channel(channelName)
      .on('postgres_changes', { event, schema, table }, onEvent)
      .subscribe()
  }

  logger.database(`📡 Subscribing to ${schema}.${table} [${channelName}]`, {
    module: ctx.module,
    fn: ctx.fn,
    requestId: ctx.requestId,
  })

  return supabase
    .channel(channelName)
    .on('postgres_changes', { event, schema, table }, (payload) => {
      logRealtimeEvent(channelName, payload.eventType ?? event, payload, ctx)
      onEvent(payload)
    })
    .subscribe((status) => {
      const emoji = status === 'SUBSCRIBED' ? '✅' : status === 'CHANNEL_ERROR' ? '❌' : '🔄'
      logger.database(`${emoji} Channel [${channelName}]: ${status}`, {
        module: ctx.module,
        fn: ctx.fn,
        requestId: ctx.requestId,
      })
    })
}

export { createDebugClient, logSupabaseAuth, logRealtimeEvent, subscribeWithLogging }
