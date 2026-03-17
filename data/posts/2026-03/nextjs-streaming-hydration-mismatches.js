window.onPostDataLoaded({
    "title": "Fixing Next.js Streaming Hydration Mismatches",
    "slug": "nextjs-streaming-hydration-mismatches",
    "language": "TypeScript",
    "code": "HydrationError",
    "tags": [
        "Next.js",
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>In Next.js architectures heavily utilizing React Server Components (RSC), hydration mismatches occur when the initial HTML rendered on the server differs from the first render on the client. When using streaming (Suspense), the client may attempt to hydrate a partial tree while the server is still pushing data chunks.</p><p>This is exacerbated by non-deterministic logic like browser-only APIs (window, localStorage) or timestamps being accessed during the initial render pass, causing React to discard the server-rendered DOM and rebuild it from scratch.</p>",
    "root_cause": "Difference between server-generated HTML and client-side initial render state, often caused by conditional rendering based on 'window' or time.",
    "bad_code": "export default function Component() {\n  // Error: Server and Client will have different values\n  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;\n  \n  return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>;\n}",
    "solution_desc": "Use the useEffect hook to handle client-side specific state, ensuring the initial render matches the server's output perfectly.",
    "good_code": "\"use client\";\nimport { useState, useEffect } from 'react';\n\nexport default function Component() {\n  const [isMobile, setIsMobile] = useState(false);\n\n  useEffect(() => {\n    setIsMobile(window.innerWidth < 768);\n  }, []);\n\n  return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>;\n}",
    "verification": "Check the browser console for 'Hydration failed' warnings. Use React DevTools to confirm the server and client trees align.",
    "date": "2026-03-17",
    "id": 1773722817,
    "type": "error"
});