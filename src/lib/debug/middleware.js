/**
 * @fileoverview Next.js Middleware and Route Handler wrapper for the Debug Toolkit.
 * Handles automatic request/response logging, request ID injection, and timing.
 *
 * Compatible with Next.js 16 App Router middleware at `src/middleware.js`.
 *
 * @module debug/middleware
 */

import { NextResponse } from 'next/server'
import { logger } from './logger.js'
import { logRequest, logResponse, logError } from './helpers.js'
import { IS_DEV, DEBUG_ENABLED } from './logger.js'

// ─── Request ID Generator ─────────────────────────────────────────────────────

/**
 * Generates a compact request ID using crypto.randomUUID() when available,
 * falling back to a timestamp + random string.
 *
 * @returns {string} A unique request identifier (36 chars max)
 */
function generateRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

// ─── createDebugMiddleware ─────────────────────────────────────────────────────

/**
 * Creates a Next.js middleware function that:
 * 1. Injects a unique `x-request-id` header on every request
 * 2. Logs the incoming request (method + URL)
 * 3. Attaches `x-request-start` for downstream duration calculation
 *
 * Designed to be composed with your existing middleware logic.
 *
 * @param {(req: import('next/server').NextRequest, res: NextResponse) => NextResponse | Promise<NextResponse>} [existingMiddleware]
 * - Optional existing middleware to chain after logging
 * @returns {(req: import('next/server').NextRequest) => Promise<NextResponse>}
 *
 * @example
 * // src/middleware.js
 * import { createDebugMiddleware } from '@/lib/debug'
 *
 * export const middleware = createDebugMiddleware()
 *
 * export const config = {
 *   matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
 * }
 *
 * @example
 * // Composing with existing Supabase session middleware:
 * import { createDebugMiddleware } from '@/lib/debug'
 * import { updateSession } from '@/lib/supabaseServer'
 *
 * export const middleware = createDebugMiddleware(updateSession)
 */
function createDebugMiddleware(existingMiddleware) {
  /**
   * @param {import('next/server').NextRequest} request
   * @returns {Promise<NextResponse>}
   */
  return async function debugMiddleware(request) {
    if (!IS_DEV && !DEBUG_ENABLED) {
      // In production without DEBUG, skip all overhead and pass through
      if (existingMiddleware) return existingMiddleware(request)
      return NextResponse.next()
    }

    const requestId = request.headers.get('x-request-id') ?? generateRequestId()
    const startTime = Date.now()

    // Skip logging for static assets and Next.js internals
    const pathname = request.nextUrl.pathname
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|css)$/)
    ) {
      if (existingMiddleware) {
        const res = await existingMiddleware(request)
        const response = res ?? NextResponse.next()
        response.headers.set('x-request-id', requestId)
        return response
      }
      const response = NextResponse.next()
      response.headers.set('x-request-id', requestId)
      return response
    }

    // ── Log incoming request ──
    logRequest({
      method: request.method,
      url: request.url,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
      headers: {
        'content-type': request.headers.get('content-type'),
        'user-agent': request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        // Note: Authorization is intentionally omitted to avoid leaking tokens
      },
      requestId,
      module: 'middleware',
      fn: 'debugMiddleware',
    })

    // ── Run downstream middleware ──
    let response
    try {
      if (existingMiddleware) {
        response = await existingMiddleware(request)
        response = response ?? NextResponse.next()
      } else {
        response = NextResponse.next()
      }
    } catch (err) {
      logError({
        error: err,
        module: 'middleware',
        fn: 'debugMiddleware',
        requestId,
        method: request.method,
        url: request.url,
      })
      response = NextResponse.next()
    }

    // ── Inject request ID and timing headers ──
    response.headers.set('x-request-id', requestId)
    response.headers.set('x-request-start', String(startTime))

    // ── Log response ──
    const duration = Date.now() - startTime
    logResponse({
      status: response.status,
      duration,
      requestId,
      module: 'middleware',
      fn: 'debugMiddleware',
      method: request.method,
      url: request.url,
    })

    return response
  }
}

// ─── withDebugLogging ─────────────────────────────────────────────────────────

/**
 * Wraps a Next.js Route Handler (GET, POST, etc.) with full debug logging.
 * Captures: method, URL, headers, response status, duration, and errors.
 *
 * @template T
 * @param {(req: import('next/server').NextRequest, ctx: {params: Record<string,string>}) => Promise<NextResponse<T>>} handler
 * - The Route Handler function to wrap
 * @param {object} [options]
 * @param {string} [options.module]  - Module path (e.g. 'api/orders/route')
 * @param {string} [options.fn]      - Handler name (e.g. 'POST')
 * @returns {(req: import('next/server').NextRequest, ctx: {params: Record<string,string>}) => Promise<NextResponse<T>>}
 *
 * @example
 * // src/app/api/orders/route.js
 * import { withDebugLogging } from '@/lib/debug'
 *
 * async function _POST(request, { params }) {
 *   const body = await request.json()
 *   // ... handler logic ...
 *   return NextResponse.json({ success: true })
 * }
 *
 * export const POST = withDebugLogging(_POST, {
 *   module: 'api/orders/route',
 *   fn: 'POST',
 * })
 */
function withDebugLogging(handler, { module: mod, fn } = {}) {
  return async function wrappedHandler(request, ctx) {
    if (!IS_DEV && !DEBUG_ENABLED) {
      return handler(request, ctx)
    }

    const requestId =
      request.headers.get('x-request-id') ?? generateRequestId()
    const startTime = Date.now()
    const handlerName = fn ?? handler.name ?? 'handler'
    const moduleName = mod ?? 'api/unknown'

    // Open a log group for this request
    logger.group(`${request.method} ${new URL(request.url).pathname}`, requestId)

    // ── Log incoming request ──
    logRequest({
      method: request.method,
      url: request.url,
      params: ctx?.params,
      searchParams: Object.fromEntries(
        new URL(request.url).searchParams.entries(),
      ),
      requestId,
      module: moduleName,
      fn: handlerName,
    })

    let response
    try {
      response = await handler(request, ctx)
    } catch (err) {
      logError({
        error: err,
        module: moduleName,
        fn: handlerName,
        requestId,
        method: request.method,
        url: request.url,
      })
      logger.groupEnd(`${request.method} ${new URL(request.url).pathname}`, requestId)
      throw err
    }

    const duration = Date.now() - startTime

    // ── Log response ──
    logResponse({
      status: response.status,
      duration,
      requestId,
      module: moduleName,
      fn: handlerName,
      method: request.method,
      url: request.url,
    })

    logger.groupEnd(`${request.method} ${new URL(request.url).pathname}`, requestId)
    return response
  }
}

export { createDebugMiddleware, withDebugLogging, generateRequestId }
