window.onPostDataLoaded({
    "title": "Fixing Haskell Lazy Evaluation Space Leaks",
    "slug": "haskell-lazy-evaluation-space-leaks",
    "language": "Haskell",
    "code": "MemoryLeak",
    "tags": [
        "Haskell",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput stream processing, Haskell's default lazy evaluation can lead to 'space leaks' where the heap grows indefinitely. This happens because the runtime creates 'thunks' (unevaluated expressions) instead of computing values immediately. In a long-running stream, these thunks accumulate, holding references to data that should have been garbage collected, eventually leading to Out Of Memory (OOM) errors.</p>",
    "root_cause": "The use of lazy accumulation functions like foldl instead of the strict foldl', causing a build-up of unevaluated thunk chains in the heap.",
    "bad_code": "import Data.List (foldl)\n\n-- Processing a stream of metrics\nprocessStream :: [Int] -> Int\nprocessStream xs = foldl (\\acc x -> acc + x) 0 xs",
    "solution_desc": "Switch to strict evaluation using the `foldl'` function from `Data.List` and apply BangPatterns to force the evaluation of accumulator variables at each step. This ensures that the memory footprint remains constant regardless of the stream size.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nimport Data.List (foldl')\n\n-- Strict evaluation prevents thunk build-up\nprocessStream :: [Int] -> Int\nprocessStream xs = foldl' (\\ !acc x -> acc + x) 0 xs",
    "verification": "Run the application with GHC RTS options `+RTS -hy` to generate a heap profile. Use `hp2ps` to visualize and confirm that memory usage is constant (a flat line) rather than linear growth.",
    "date": "2026-03-31",
    "id": 1774920340,
    "type": "error"
});