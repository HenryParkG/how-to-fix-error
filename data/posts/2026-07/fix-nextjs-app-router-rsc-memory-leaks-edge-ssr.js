window.onPostDataLoaded({
    "title": "Fix Next.js App Router RSC Memory Leaks in Edge SSR",
    "slug": "fix-nextjs-app-router-rsc-memory-leaks-edge-ssr",
    "language": "TypeScript",
    "code": "ERR_OUT_OF_MEMORY",
    "tags": [
        "Next.js",
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>Next.js App Router leverages React Server Components (RSC) to stream HTML directly from Edge runtime environments. However, creating persistent closures, module-scope cache stores, or uncollected event listeners inside server context causes garbage collection targets to remain rooted across long-lived V8 isolates.</p><p>Because Edge runtimes handle thousands of requests per isolate instance, leaky async context handlers and unhandled readable streams cause heap memory to accumulate until the worker process terminates with out-of-memory errors.</p>",
    "root_cause": "Module-level global Map caching React request contexts, along with stream listeners that fail to detach when clients abort HTTP requests early during edge SSR streaming.",
    "bad_code": "// Module-level global store leaks across request contexts on Edge Isolate\nconst requestCache = new Map<string, any>();\n\nexport async function GET(req: Request) {\n  const url = new URL(req.url);\n  if (!requestCache.has(url.pathname)) {\n    requestCache.set(url.pathname, await fetchData(url.pathname));\n  }\n  \n  const stream = new ReadableStream({\n    start(controller) {\n      req.signal.addEventListener(\"abort\", () => console.log(\"aborted\"));\n    }\n  });\n  return new Response(stream);\n}",
    "solution_desc": "Leverage React cache() for request-scoped deduplication, register self-cleaning AbortSignal event listeners, and eliminate module-level mutable state allocations.",
    "good_code": "import { cache } from 'react';\n\n// Scope lifetime strictly to current request render pass\nconst getCachedData = cache(async (pathname: string) => {\n  return await fetchData(pathname);\n});\n\nexport async function GET(req: Request) {\n  const url = new URL(req.url);\n  const data = await getCachedData(url.pathname);\n\n  const stream = new ReadableStream({\n    start(controller) {\n      const onAbort = () => {\n        try { controller.close(); } catch (_) {}\n        req.signal.removeEventListener(\"abort\", onAbort);\n      };\n      req.signal.addEventListener(\"abort\", onAbort, { once: true });\n      controller.enqueue(new TextEncoder().encode(JSON.stringify(data)));\n      controller.close();\n    }\n  });\n\n  return new Response(stream, { headers: { 'content-type': 'text/html' } });\n}",
    "verification": "Perform load testing using autocannon with canceled requests and inspect V8 heap snapshots via Node inspect CLI to ensure memory returns to baseline after GC cycles.",
    "date": "2026-07-22",
    "id": 1784698816,
    "type": "error"
});