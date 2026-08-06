window.onPostDataLoaded({
    "title": "Fix Next.js Server Action Memory Leaks in Streaming SSR",
    "slug": "fix-nextjs-server-action-memory-leaks-streaming-ssr",
    "language": "TypeScript",
    "code": "ERR_MEM_LEAK",
    "tags": [
        "Next.js",
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>When using Next.js App Router with React Server Components (RSC) and Server Actions in a streaming SSR context, Node.js server processes can experience rapid heap memory consumption and eventual OOM crashes under high concurrency.</p><p>This occurs when inline Server Actions defined inside rendering component scopes capture request-scoped contextual objects (e.g., request headers, cookies, or large React tree parameters) via closures. When React streams the SSR response using Suspense boundary chunks, these uncollected closures remain pinned in memory via internal React DOM Server stream controllers, preventing Garbage Collection (GC) from reclaiming memory.</p>",
    "root_cause": "Inline 'use server' definitions inside Server Components capture scope context on every render, retaining reference graphs inside React's streaming context across active SSR response streams.",
    "bad_code": "// bad-component.tsx\nimport { headers } from 'next/headers';\n\nexport default async function StreamingPage() {\n  const reqHeaders = await headers(); // Request context reference\n  const largeDataBuffer = new Array(10000).fill('context-payload');\n\n  // BUG: Inline Server Action closes over request context and large objects\n  async function handleFormSubmit(formData: FormData) {\n    'use server';\n    console.log('User Agent:', reqHeaders.get('user-agent'));\n    console.log('Buffer Len:', largeDataBuffer.length);\n  }\n\n  return (\n    <form action={handleFormSubmit}>\n      <button type=\"submit\">Submit</button>\n    </form>\n  );\n}",
    "solution_desc": "1. Extract Server Actions out of component render functions into dedicated standalone server action files tagged with top-level `'use server'` directives.\n2. Pass explicit primitive values (e.g. IDs) as arguments rather than relying on component-scoped lexical closures.\n3. Access request headers and cookies directly within the isolated action execution lifecycle using AsyncLocalStorage primitives provided by Next.js (`next/headers`).",
    "good_code": "// actions.ts\n'use server';\n\nimport { headers } from 'next/headers';\n\n// Extracted to module level: no component lexical closures captured\nexport async function handleFormSubmit(itemId: string, formData: FormData) {\n  const reqHeaders = await headers();\n  const userAgent = reqHeaders.get('user-agent');\n  console.log('Submitted Item:', itemId, 'User Agent:', userAgent);\n}\n\n// page.tsx\nimport { handleFormSubmit } from './actions';\n\nexport default async function StreamingPage() {\n  const itemId = \"item-123\";\n  // Bind only specific parameters safely\n  const boundAction = handleFormSubmit.bind(null, itemId);\n\n  return (\n    <form action={boundAction}>\n      <button type=\"submit\">Submit</button>\n    </form>\n  );\n}",
    "verification": "Run a load test against the SSR route using `autocannon -c 100 -d 60 http://localhost:3000/streaming-page`. Take heap dumps using `node --inspect` and verify via Chrome DevTools memory profiler that GC successfully reclaims `ServerAction` objects.",
    "date": "2026-08-06",
    "id": 1786004199,
    "type": "error"
});