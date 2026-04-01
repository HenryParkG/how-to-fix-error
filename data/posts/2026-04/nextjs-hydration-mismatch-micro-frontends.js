window.onPostDataLoaded({
    "title": "Fix Next.js Hydration Mismatches in Micro-Frontends",
    "slug": "nextjs-hydration-mismatch-micro-frontends",
    "language": "Next.js",
    "code": "HYDRATION_ERROR",
    "tags": [
        "Next.js",
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>Hydration mismatches occur when the pre-rendered HTML from the server does not match the first render on the client. In Micro-Frontend (MFE) architectures using Module Federation or dynamic imports, this is often caused by 'window' dependencies, non-deterministic IDs, or remote components that load faster/slower than expected, causing the DOM tree to diverge during the hydration phase.</p>",
    "root_cause": "Accessing browser-only globals (like window.localStorage) or rendering time-dependent data inside the initial render loop before the client-side component has mounted.",
    "bad_code": "const MyComponent = () => {\n  // Error: window is undefined on server, but exists on client\n  const theme = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : 'light';\n  \n  return <div className={theme}>Content</div>;\n};",
    "solution_desc": "Use the `useEffect` hook to ensure that client-specific logic only executes after the initial mount, or use the `dynamic` helper from Next.js with `ssr: false` to skip server-side rendering for problematic MFE components.",
    "good_code": "import dynamic from 'next/dynamic';\nimport { useState, useEffect } from 'react';\n\nconst MyComponent = () => {\n  const [theme, setTheme] = useState('light');\n\n  useEffect(() => {\n    // Safe: Runs only on the client after hydration\n    setTheme(window.localStorage.getItem('theme') || 'light');\n  }, []);\n\n  return <div className={theme}>Content</div>;\n};",
    "verification": "Run the application and check the browser console for 'Text content did not match' warnings. Verify the UI doesn't 'flicker' on load.",
    "date": "2026-04-01",
    "id": 1775037823,
    "type": "error"
});