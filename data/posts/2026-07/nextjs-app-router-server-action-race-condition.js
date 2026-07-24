window.onPostDataLoaded({
    "title": "Fixing Next.js Server Action Race in RSC Contexts",
    "slug": "nextjs-app-router-server-action-race-condition",
    "language": "TypeScript",
    "code": "HydrationMismatch",
    "tags": [
        "Next.js",
        "TypeScript",
        "React",
        "Error Fix"
    ],
    "analysis": "<p>When invoking Next.js App Router Server Actions during rapid user interactions, dynamic React Server Component (RSC) revalidations can trigger client hydration race conditions. If a slower initial Server Action resolves after a faster subsequent action, <code>router.refresh()</code> or automatically triggered server revalidations apply outdated RSC payload trees over newer client DOM nodes. This results in stale UI state overwrites, unexpected state regressions, and React client-side hydration warnings.</p>",
    "root_cause": "Unsynchronized concurrent Server Action executions trigger dynamic server updates that return out-of-order RSC diffs, overwriting optimistic client updates without sequence control or cancellation logic.",
    "bad_code": "'use client';\nimport { useState, useTransition } from 'react';\nimport { updateItem } from './actions';\n\nexport function Counter({ id }: { id: string }) {\n  const [isPending, startTransition] = useTransition();\n  const [count, setCount] = useState(0);\n\n  const handleClick = () => {\n    setCount((prev) => prev + 1);\n    startTransition(async () => {\n      // Concurrent executions race each other and overwrite RSC payloads out-of-order\n      await updateItem(id, count + 1);\n    });\n  };\n\n  return <button onClick={handleClick}>Count: {count}</button>;\n}",
    "solution_desc": "Manage mutating Server Actions using `useActionState` paired with `useOptimistic` for deterministic client rendering, and track request sequence counters or timestamps inside action signatures to reject outdated RSC payloads.",
    "good_code": "'use client';\nimport { useOptimistic, useActionState, startTransition } from 'react';\nimport { updateItemWithSeq } from './actions';\n\nexport function Counter({ id, initialCount }: { id: string; initialCount: number }) {\n  const [state, formAction, isPending] = useActionState(updateItemWithSeq, {\n    count: initialCount,\n    seq: 0,\n  });\n\n  const [optimisticCount, setOptimistic] = useOptimistic(\n    state.count,\n    (current: number, update: number) => update\n  );\n\n  const handleIncrement = () => {\n    const nextVal = optimisticCount + 1;\n    startTransition(async () => {\n      setOptimistic(nextVal);\n      const formData = new FormData();\n      formData.append('id', id);\n      formData.append('count', String(nextVal));\n      formData.append('clientSeq', String(Date.now()));\n      await formAction(formData);\n    });\n  };\n\n  return <button onClick={handleIncrement} disabled={isPending}>Value: {optimisticCount}</button>;\n}",
    "verification": "Simulate high latency networks (3G throttling in Chrome DevTools), execute rapid multi-click events on the action trigger, and verify via Network tab that older RSC payloads do not overwrite subsequent UI updates.",
    "date": "2026-07-24",
    "id": 1784880519,
    "type": "error"
});