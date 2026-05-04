window.onPostDataLoaded({
    "title": "Fixing Haskell Space Leaks in Stateful Stream Processors",
    "slug": "haskell-stream-space-leaks",
    "language": "Haskell",
    "code": "Space Leak",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Haskell stream processing libraries like Conduit or Pipes, stateful transformations often accumulate 'thunks' instead of evaluated values. This occurs because Haskell's default lazy evaluation defers computation until the result is explicitly demanded. In a long-running stream, these unevaluated expressions (thunks) grow linearly in memory, eventually leading to an Out-of-Memory (OOM) crash despite the logic appearing constant-space.</p>",
    "root_cause": "The accumulator in a stateful fold or 'scan' operation is not being forced to Weak Head Normal Form (WHNF), causing a chain of deferred computations to be stored in the heap.",
    "bad_code": "import Data.Conduit\nimport qualified Data.Conduit.List as CL\n\n-- This accumulator grows thunks lazily\nstatefulSum = CL.scanl (\\acc x -> acc + x) 0",
    "solution_desc": "Use strict versions of folding functions (e.g., scanl') or apply BangPatterns to the accumulator to force evaluation at each step of the stream processing.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nimport Data.Conduit\nimport qualified Data.Conduit.List as CL\n\n-- Use strict application or BangPatterns to force evaluation\nstatefulSum = CL.scanl' (\\acc x -> let !n = acc + x in n) 0",
    "verification": "Run the application with RTS options '-hy' to generate a heap profile. A flat line indicates constant memory usage, whereas a rising slope indicates a leak.",
    "date": "2026-05-04",
    "id": 1777859928,
    "type": "error"
});