window.onPostDataLoaded({
    "title": "Next.js Hydration: Solving Server-Client Divergence",
    "slug": "nextjs-hydration-mismatch-fix",
    "language": "TypeScript",
    "code": "HydrationMismatch",
    "tags": [
        "Next.js",
        "React",
        "TypeScript",
        "Error Fix"
    ],
    "analysis": "<p>Hydration mismatch occurs when the pre-rendered HTML from the server doesn't match the first render in the browser. This is common in Next.js when using dynamic values like <code>window.innerWidth</code>, <code>localStorage</code>, or <code>new Date()</code> directly in the JSX. React detects the discrepancy and is forced to discard the server HTML, leading to slower page loads and potential UI flickering.</p>",
    "root_cause": "Accessing browser-only APIs or non-deterministic data during the initial render pass of a component.",
    "bad_code": "export default function Component() {\n  const isMobile = window.innerWidth < 768; // Error: window is not defined on server\n  return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>;\n}",
    "solution_desc": "Use a `useEffect` hook to update the state only after the component has mounted on the client, ensuring the initial server-side render remains consistent.",
    "good_code": "import { useState, useEffect } from 'react';\n\nexport default function Component() {\n  const [isMobile, setIsMobile] = useState(false);\n\n  useEffect(() => {\n    setIsMobile(window.innerWidth < 768);\n  }, []);\n\n  return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>;\n}",
    "verification": "Check the browser console for 'Hydration failed' warnings. Use React DevTools to ensure the DOM nodes are not being recreated on load.",
    "date": "2026-02-14",
    "id": 1771050877,
    "type": "error"
});