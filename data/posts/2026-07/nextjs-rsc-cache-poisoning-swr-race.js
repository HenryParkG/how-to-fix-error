window.onPostDataLoaded({
    "title": "Fixing Next.js RSC Cache Poisoning & SWR Races",
    "slug": "nextjs-rsc-cache-poisoning-swr-race",
    "language": "Next.js",
    "code": "NextJS-RSC-Poison",
    "tags": [
        "Next.js",
        "TypeScript",
        "React",
        "Error Fix"
    ],
    "analysis": "<p>Next.js React Server Components (RSC) implement aggressive caching via the Data Cache and Full Route Cache. A common security and consistency bug occurs when multiple concurrent dynamic requests are processed by the same server instance. If dynamic API calls or custom fetch commands are made without unique request-scoped memoization (or if global dynamic cache identifiers are mutated synchronously), the layout cache gets poisoned. This leads to Stale-While-Revalidate race conditions where User A is served a layout or data block belonging to User B, leading to critical data leak vulnerabilities.</p>",
    "root_cause": "Improper sharing of data fetching contexts or relying on a single static layout fetch key. When Next.js merges static and dynamic components, it relies on React's request-scoped 'cache' helper. Failing to wrap database or API fetches in this container can cause parallel requests to reuse the same in-memory promise, leaking cross-request data.",
    "bad_code": "// Bad: Sharing global context or missing request-scoped memoization wrapper\n// This allows parallel requests to bleed into each other and poison the cache\nlet sharedUserSessionId: string | null = null;\n\nasync function getUserData() {\n  const response = await fetch(`https://api.internal/user?id=${sharedUserSessionId}`, {\n    next: { revalidate: 60 }\n  });\n  return response.json();\n}\n\nexport default async function DashboardLayout({ children }: { children: React.ReactNode }) {\n  // Bad pattern: setting variable from request headers globally\n  const headers = await import('next/headers');\n  sharedUserSessionId = headers.headers().get('x-user-id');\n  \n  const data = await getUserData();\n  return (\n    <div>\n      <header>User: {data.name}</header>\n      {children}\n    </div>\n  );\n}",
    "solution_desc": "Architect a secure dynamic data flow by wrapping fetch inputs and database queries within React's request-scoped `cache` helper. Ensure that headers and cookie structures are evaluated inside the component render cycle to correctly trigger dynamic rendering, completely avoiding global variable state.",
    "good_code": "import { cache } from 'react';\nimport { headers } from 'next/headers';\n\n// Good: Use React's cache function to scope memoization strictly to the single request lifecycle\nconst getUserDataSecure = cache(async (userId: string) => {\n  const response = await fetch(`https://api.internal/user?id=${userId}`, {\n    // Dynamic data scoped properly with custom tag keys\n    next: { \n      revalidate: 60, \n      tags: [`user-${userId}`] \n    }\n  });\n  if (!response.ok) throw new Error('Failed to fetch secure data');\n  return response.json();\n});\n\nexport default async function DashboardLayout({ children }: { children: React.ReactNode }) {\n  const headerStore = await headers();\n  const userId = headerStore.get('x-user-id');\n\n  if (!userId) {\n    return <div>Unauthenticated</div>;\n  }\n\n  const data = await getUserDataSecure(userId);\n  return (\n    <div>\n      <header>User: {data.name}</header>\n      {children}\n    </div>\n  );\n}",
    "verification": "Use high-concurrency HTTP benchmarking tools (like k6 or wrk) to send parallel requests with varied user-session headers. Verify that zero response payloads contain mismatched tenant IDs or invalid SWR outputs.",
    "date": "2026-07-11",
    "id": 1783747971,
    "type": "error"
});