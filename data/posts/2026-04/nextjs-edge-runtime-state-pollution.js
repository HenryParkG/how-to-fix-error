window.onPostDataLoaded({
    "title": "Debugging State Pollution in Next.js Edge Runtime",
    "slug": "nextjs-edge-runtime-state-pollution",
    "language": "TypeScript",
    "code": "StateLeak",
    "tags": [
        "Next.js",
        "TypeScript",
        "React",
        "Error Fix"
    ],
    "analysis": "<p>Next.js Edge Runtime leverages V8 Isolates which are frequently reused across different incoming requests to minimize cold start latency. If a developer declares a variable in the global scope of a middleware or an Edge route, that variable persists in memory. Subsequent requests will access the modified value from previous requests, leading to severe data leakage and inconsistent UI states.</p>",
    "root_cause": "Declaring mutable variables in the global module scope instead of within the request handler function.",
    "bad_code": "let cachedUser: string | null = null;\n\nexport const config = { runtime: 'edge' };\n\nexport default async function handler(req: Request) {\n  const auth = req.headers.get('authorization');\n  if (!cachedUser) cachedUser = await fetchUser(auth);\n  return new Response(`Hello ${cachedUser}`);\n}",
    "solution_desc": "Refactor logic to be entirely stateless or use AsyncLocalStorage to scope data to the specific execution context of a single request.",
    "good_code": "export const config = { runtime: 'edge' };\n\nexport default async function handler(req: Request) {\n  // Scope variables strictly inside the handler\n  const auth = req.headers.get('authorization');\n  const user = await fetchUser(auth);\n  return new Response(`Hello ${user}`);\n}",
    "verification": "Perform multiple concurrent requests with different headers and verify that responses do not contain cross-contaminated data.",
    "date": "2026-04-04",
    "id": 1775295046,
    "type": "error"
});