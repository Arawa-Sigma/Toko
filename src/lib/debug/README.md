# Developer Debug Toolkit

A centralized, zero-dependency debug toolkit for the **SembakoBerkah** Next.js 16 + Supabase project.

## 📁 Folder Structure

```
src/lib/debug/
├── index.js        ← Single barrel import: @/lib/debug
├── logger.js       ← Core logger (8 levels, ANSI colors, deduplication)
├── formatter.js    ← Pretty-printer, sanitizer, error formatter
├── timer.js        ← Async execution time wrappers
├── helpers.js      ← logRequest, logResponse, logError, logQuery, logAuth, logPerformance
├── middleware.js   ← Next.js middleware & Route Handler wrapper
├── inspectors.js   ← Cookie, header, session, environment inspectors
├── supabase.js     ← Supabase query/auth/realtime debug proxy
├── uncaught.js     ← Global uncaught exception handlers
└── README.md       ← This file
```

Also generated:
- `src/instrumentation.js` — auto-registers error handlers on server start

---

## ⚙️ Environment Variables

Add these to your `.env.local`:

```env
# Minimum log level: debug | info | success | warning | error | api | database | auth
LOG_LEVEL=debug

# Enable debug logs in production (default: dev only)
DEBUG=false

# Completely disable all logs (even in dev)
DISABLE_LOGS=false
```

**Behavior summary:**

| Environment | `DEBUG` | What gets logged |
|-------------|---------|-----------------|
| `development` | any | Everything ≥ LOG_LEVEL |
| `production` | `false` | Only `warning` and `error` |
| `production` | `true` | Everything ≥ LOG_LEVEL |
| any | any | `DISABLE_LOGS=true` → nothing |

---

## 🚀 Usage Examples

### 1. Basic Logger (anywhere)

```js
import { logger } from '@/lib/debug'

// Available levels:
logger.debug('Inspecting data', { module: 'my-page', fn: 'fetchData', data: someObj })
logger.info('Server initialized', { module: 'layout' })
logger.success('Order created successfully', { module: 'api/orders/route', fn: 'POST', duration: 43 })
logger.warning('Fallback triggered', { module: 'dashboard/users/page' })
logger.error('Database connection failed', { module: 'lib/supabaseServer', data: err })
logger.api('→ GET /api/products', { requestId: 'abc-123' })
logger.database('SELECT profiles', { module: 'dashboard/users/page', duration: 22 })
logger.auth('SIGNED_IN user:abc12345', { module: 'middleware' })

// Visual grouping for related logs:
logger.group('Processing order #42', requestId)
// ... logs ...
logger.groupEnd('Processing order #42', requestId)

// Separator line
logger.separator('Auth Flow')
```

---

### 2. API Route Handlers

```js
// src/app/api/orders/route.js
import { NextResponse } from 'next/server'
import { withDebugLogging, createRequestLogger, logError } from '@/lib/debug'
import { createClient } from '@/lib/supabaseServer'

async function _GET(request) {
  const requestId = request.headers.get('x-request-id')
  const rl = createRequestLogger({
    method: 'GET',
    url: request.url,
    requestId,
    module: 'api/orders/route',
    fn: 'GET',
  })

  rl.logReq()

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('orders').select('*')
    if (error) throw error

    rl.logRes({ status: 200 })
    return NextResponse.json({ orders: data })
  } catch (err) {
    rl.logErr(err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// Wrap with debug middleware:
export const GET = withDebugLogging(_GET, {
  module: 'api/orders/route',
  fn: 'GET',
})
```

---

### 3. Server Components (App Router)

```js
// src/app/dashboard/orders/page.js
import { createClient } from '@/lib/supabaseServer'
import { createDebugClient, withTimer, inspectSession, logger } from '@/lib/debug'

export default async function OrdersPage() {
  const supabase = await createClient()

  // Wrap with debug client — all .from() calls are auto-logged
  const db = createDebugClient(supabase, {
    module: 'dashboard/orders/page',
    fn: 'OrdersPage',
  })

  // Inspect current session (server side)
  await inspectSession({ supabase, module: 'dashboard/orders/page' })

  // Measure query time
  const { result: ordersResult, duration } = await withTimer(
    'Fetch orders',
    () => db.from('orders').select('*, profiles(name, email)'),
    { module: 'dashboard/orders/page', fn: 'OrdersPage' }
  )

  const { data: orders, error } = ordersResult

  if (error) {
    logger.error('Failed to fetch orders', {
      module: 'dashboard/orders/page',
      data: error,
    })
    return <div>Error loading orders.</div>
  }

  return <div>{/* render orders */}</div>
}
```

---

### 4. Server Actions

```js
// src/app/dashboard/orders/actions.js
'use server'
import { createClient } from '@/lib/supabaseServer'
import { createDebugClient, logError, logAuth, withTimer } from '@/lib/debug'

export async function updateOrderStatus(orderId, status) {
  const supabase = await createClient()
  const db = createDebugClient(supabase, {
    module: 'dashboard/orders/actions',
    fn: 'updateOrderStatus',
  })

  // Verify session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    logAuth({
      event: 'UNAUTHORIZED',
      module: 'dashboard/orders/actions',
      fn: 'updateOrderStatus',
    })
    throw new Error('Unauthorized')
  }

  const { result, duration } = await withTimer(
    `Update order ${orderId} → ${status}`,
    () => db.from('orders').update({ status }).eq('id', orderId),
    { module: 'dashboard/orders/actions', fn: 'updateOrderStatus' }
  )

  if (result.error) {
    logError({
      error: result.error,
      module: 'dashboard/orders/actions',
      fn: 'updateOrderStatus',
      userId: session.user.id,
      input: { orderId, status },
    })
    throw result.error
  }
}
```

---

### 5. Next.js Middleware

```js
// src/middleware.js
import { createDebugMiddleware } from '@/lib/debug'

// Option A: Standalone (adds request ID + logging to all routes)
export const middleware = createDebugMiddleware()

// Option B: Compose with your existing Supabase session middleware
// import { updateSession } from '@/lib/supabaseServer'
// export const middleware = createDebugMiddleware(updateSession)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

### 6. Client Components (Browser)

The logger is browser-safe. ANSI colors are automatically stripped on the client side; standard `console` colors apply.

```js
// src/components/SomeClientComponent.js
'use client'
import { useEffect } from 'react'
import { logger } from '@/lib/debug'

export function SomeComponent({ userId }) {
  useEffect(() => {
    logger.info('Component mounted', { module: 'components/SomeComponent', fn: 'useEffect' })

    return () => {
      logger.debug('Component unmounted', { module: 'components/SomeComponent' })
    }
  }, [])

  // ...
}
```

---

### 7. Supabase Auth Events (Client)

```js
// src/components/AuthProvider.js
'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { logSupabaseAuth } from '@/lib/debug'

export function AuthProvider({ children }) {
  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logSupabaseAuth(event, session, { module: 'components/AuthProvider' })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return children
}
```

---

### 8. Supabase Realtime

```js
// src/app/dashboard/orders/page.js (client component)
'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { subscribeWithLogging } from '@/lib/debug'

export function LiveOrders() {
  useEffect(() => {
    const supabase = createClient()

    const channel = subscribeWithLogging(supabase, {
      channelName: 'orders-live',
      table: 'orders',
      event: '*',
      onEvent: (payload) => {
        // Handle the event in your UI
        console.log('Real-time update:', payload)
      },
      ctx: { module: 'dashboard/orders/page', fn: 'LiveOrders' },
    })

    return () => supabase.removeChannel(channel)
  }, [])
}
```

---

### 9. Execution Time Measurement

```js
import { startTimer, withTimer, measureAll, createPerfMark } from '@/lib/debug'

// Option A: Manual timer
const timer = startTimer()
await someWork()
logger.info('Done', { duration: timer.stop() })

// Option B: Wrap an async function
const { result, duration } = await withTimer(
  'Heavy computation',
  () => expensiveAsyncFn(),
  { module: 'lib/heavy' }
)

// Option C: Multiple operations in sequence
const [usersResult, productsResult] = await measureAll([
  { label: 'Fetch users', fn: () => supabase.from('profiles').select('*') },
  { label: 'Fetch products', fn: () => supabase.from('products').select('*') },
])

// Option D: Named performance marks
const perf = createPerfMark('Checkout flow')
await step1()
perf.mark('after payment init')
await step2()
perf.mark('after order creation')
```

---

### 10. Inspectors

```js
import { cookies, headers } from 'next/headers'
import { createClient } from '@/lib/supabaseServer'
import {
  inspectCookies,
  inspectHeaders,
  inspectSession,
  inspectEnvironment,
} from '@/lib/debug'

// In a Server Component:
const cookieStore = await cookies()
inspectCookies({ cookieStore, module: 'dashboard/layout' })

const headerStore = await headers()
inspectHeaders({ headers: headerStore, module: 'dashboard/layout' })

const supabase = await createClient()
await inspectSession({ supabase, module: 'dashboard/layout' })

inspectEnvironment({ module: 'dashboard/layout' })
```

---

## 🔒 Security

- **Passwords, tokens, keys, cookies** → always replaced with `[REDACTED]`
- **Email addresses** → partially masked in session inspector
- **Authorization headers** → never logged in request logger
- **Production** → only `warning` and `error` are logged unless `DEBUG=true`
- **All sanitization** is applied via `formatter.sanitize()` before any log emission

---

## 🎨 Log Level Cheat Sheet

| Level | Emoji | When to use |
|-------|-------|-------------|
| `debug` | 🔍 | Internal state, variable values |
| `info` | ℹ️ | Lifecycle events, startup |
| `success` | ✅ | Successful operations, completed tasks |
| `warning` | ⚠️ | Fallbacks, degraded paths, missing optional data |
| `error` | ❌ | Exceptions, DB errors, auth failures |
| `api` | 🌐 | HTTP requests and responses |
| `database` | 🗄️ | Supabase queries, realtime events |
| `auth` | 🔐 | Sign in, sign out, token refresh |
