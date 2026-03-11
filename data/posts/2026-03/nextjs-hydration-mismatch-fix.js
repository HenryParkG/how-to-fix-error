window.onPostDataLoaded({
    "title": "Debugging Selective Hydration Mismatches in Next.js",
    "slug": "nextjs-hydration-mismatch-fix",
    "language": "TypeScript",
    "code": "HYDRATION_ERROR",
    "tags": [
        "Next.js",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>Selective Hydration in Concurrent React allows Next.js to hydrate parts of the page independently. However, if the server-rendered HTML doesn't perfectly match the first client-side render pass, React throws a 'Hydration Mismatch' error. This often happens when developers use browser-specific APIs (like window.innerWidth) or volatile data (like Date.now()) directly in the rendering logic without waiting for the component to mount.</p>",
    "root_cause": "Accessing client-only globals (window, document) or non-deterministic values during the synchronous render phase instead of inside useEffect.",
    "bad_code": "const MyComponent = () => {\n  // Error: window is undefined on server, exists on client\n  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;\n\n  return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>;\n};",
    "solution_desc": "Initialize the state with a 'null' or default server-safe value and update it within a 'useEffect' hook. This ensures the initial client render matches the server HTML, with the client-specific UI appearing only after hydration completes.",
    "good_code": "import { useState, useEffect } from 'react';\n\nconst MyComponent = () => {\n  const [isMobile, setIsMobile] = useState<boolean | null>(null);\n\n  useEffect(() => {\n    setIsMobile(window.innerWidth < 768);\n  }, []);\n\n  if (isMobile === null) return <div />; // Or a skeleton\n  return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>;\n};",
    "verification": "Check the browser console for 'Hydration failed because the initial UI does not match' errors. Ensure no suppressHydrationWarning attributes are required.",
    "date": "2026-03-11",
    "id": 1773191472,
    "type": "error"
});