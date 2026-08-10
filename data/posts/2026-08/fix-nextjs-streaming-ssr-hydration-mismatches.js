window.onPostDataLoaded({
    "title": "Fix Next.js Streaming SSR Hydration Mismatches",
    "slug": "fix-nextjs-streaming-ssr-hydration-mismatches",
    "language": "TypeScript",
    "code": "HydrationMismatch",
    "tags": [
        "Next.js",
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>In Next.js App Router using React Server Components (RSC) and HTML Streaming SSR, hydration mismatches frequently occur when dynamic client components evaluate browser-only APIs or dynamic non-deterministic data during initial rendering.</p><p>When HTML is streamed to the client, React expects the initial client render tree to exactly match the server-rendered DOM. If dynamic client states (like client-side dynamic dates or window dimensions) differ between server output and client evaluation across Suspense boundaries, React throws hydration errors and forces costly DOM tree rebuilds.</p>",
    "root_cause": "Client components accessing non-deterministic data or browser APIs (like window or Date.now()) during initial execution generate HTML structures differing from server-streamed markup.",
    "bad_code": "'use client';\n\nimport { useState } from 'react';\n\nexport default function DynamicTimeDisplay() {\n  // Bug: Returns server timestamp on SSR, but local system time on client hydration\n  const [formattedDate] = useState(new Date().toLocaleTimeString());\n\n  return (\n    <div className=\"p-4 border rounded\">\n      <p>Current session time: {formattedDate}</p>\n    </div>\n  );\n}",
    "solution_desc": "Isolate browser-dependent dynamic rendering using useEffect hooks so that hydration finishes matching server-rendered markup before evaluating client-side dynamics. Alternatively, disable SSR for purely client-dependent widgets using dynamic imports with `{ ssr: false }`.",
    "good_code": "'use client';\n\nimport { useState, useEffect } from 'react';\n\nexport default function DynamicTimeDisplay() {\n  const [formattedDate, setFormattedDate] = useState<string | null>(null);\n\n  // Fixed: Wait until client mount before updating non-deterministic state\n  useEffect(() => {\n    setFormattedDate(new Date().toLocaleTimeString());\n  }, []);\n\n  return (\n    <div className=\"p-4 border rounded\">\n      <p>Current session time: {formattedDate ?? 'Loading...'}</p>\n    </div>\n  );\n}",
    "verification": "Open Chrome DevTools Console, enable React Developer Tools, and verify that warning logs regarding 'Text content does not match server-rendered HTML' no longer appear during page navigation.",
    "date": "2026-08-10",
    "id": 1786356545,
    "type": "error"
});