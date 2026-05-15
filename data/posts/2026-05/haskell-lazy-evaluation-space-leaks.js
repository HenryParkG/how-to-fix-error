window.onPostDataLoaded({
    "title": "Debugging Haskell Lazy Evaluation Space Leaks",
    "slug": "haskell-lazy-evaluation-space-leaks",
    "language": "Haskell",
    "code": "HeapOverflow",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Lazy evaluation is Haskell's greatest strength and its most common source of production failures. In streaming pipelines, space leaks occur when the runtime builds up a massive chain of unevaluated computations, known as 'thunks', instead of calculating the actual value.</p><p>This is particularly dangerous in long-running processes where an accumulator in a fold or a transformation isn't forced, causing the heap to grow until the process hits the OOM killer. Traditional profilers might show high memory usage but won't immediately point to the unforced thunk.</p>",
    "root_cause": "Failure to force evaluation of accumulators in recursive functions or stream processing, leading to the creation of deeply nested thunks in the heap.",
    "bad_code": "processData :: [Int] -> Int\nprocessData = foldl (\\acc x -> acc + x) 0",
    "solution_desc": "Replace lazy folds with strict variants (foldl') and use Bang Patterns (!x) to force evaluation at specific points. For complex data structures, derive Generic and use 'deepseq' to ensure entire structures are evaluated.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nimport Data.List (foldl')\n\nprocessData :: [Int] -> Int\nprocessData = foldl' (\\ !acc x -> acc + x) 0",
    "verification": "Run the binary with RTS options '+RTS -hc' to generate a heap profile. Use 'hp2ps' to visualize memory and ensure the 'Total Memory' graph remains constant rather than increasing linearly.",
    "date": "2026-05-15",
    "id": 1778843606,
    "type": "error"
});