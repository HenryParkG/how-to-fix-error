window.onPostDataLoaded({
    "title": "Fixing Next.js Hydration Mismatches & Client JS Fails",
    "slug": "fix-nextjs-hydration-mismatches-client-js-fails",
    "language": "Next.js",
    "code": "HydrationMismatch",
    "tags": [
        "Next.js",
        "React",
        "TypeScript",
        "Frontend",
        "Error Fix"
    ],
    "analysis": "<p>Hydration mismatch errors (React Error #418 / #423) trigger when the server-rendered HTML markup differs from the initial virtual DOM tree generated on client hydration. This commonly happens when components rely on client-only values (such as <code>window</code>, <code>localStorage</code>, or current local timestamps) during their initial render phase, or when invalid HTML nesting (such as embedding a <code>&lt;div&gt;</code> inside a <code>&lt;p&gt;</code>) causes the browser parser to alter the DOM tree prior to React script execution.</p>",
    "root_cause": "Rendering non-deterministic values (Date.now(), Math.random(), browser storage) directly during SSR, or invalid semantic HTML structure causing browser-level DOM mutations.",
    "bad_code": "'use client';\n\nexport default function UserProfile() {\n  // Bug: window/localStorage is undefined on server, causing different render outputs\n  const theme = typeof window !== 'undefined' ? localStorage.getItem('theme') : 'light';\n  const timestamp = new Date().toLocaleTimeString();\n\n  return (\n    <p>\n      <div>Current Theme: {theme}</div>\n      <span>Rendered at: {timestamp}</span>\n    </p>\n  );\n}",
    "solution_desc": "Defer client-specific rendering until after initial mount using a state hook with useEffect, disable SSR selectively with dynamic imports (`next/dynamic` with `ssr: false`), and ensure valid HTML nesting hierarchy.",
    "good_code": "'use client';\n\nimport { useState, useEffect } from 'react';\n\nexport default function UserProfile() {\n  const [mounted, setMounted] = useState(false);\n  const [theme, setTheme] = useState('light');\n  const [timestamp, setTimestamp] = useState('');\n\n  useEffect(() => {\n    setMounted(true);\n    setTheme(localStorage.getItem('theme') || 'light');\n    setTimestamp(new Date().toLocaleTimeString());\n  }, []);\n\n  if (!mounted) {\n    return <div className=\"h-12 animate-pulse bg-gray-100 rounded\" />;\n  }\n\n  return (\n    <div className=\"user-profile\">\n      <div>Current Theme: {theme}</div>\n      <span>Rendered at: {timestamp}</span>\n    </div>\n  );\n}",
    "verification": "Run 'next build && next start' and inspect the browser console to confirm zero hydration warnings and proper client-side component reconciliation.",
    "date": "2026-08-30",
    "id": 1788057180,
    "type": "error"
});