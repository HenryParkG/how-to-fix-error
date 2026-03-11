window.onPostDataLoaded({
    "title": "Eliminating Haskell Space Leaks in Lazy Streams",
    "slug": "haskell-lazy-stream-space-leak",
    "language": "Haskell",
    "code": "HEAP_EXHAUSTION",
    "tags": [
        "Rust",
        "Python",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's non-strict evaluation is powerful but prone to 'space leaks'\u2014memory consumption caused by the accumulation of unevaluated expressions (thunks). In stream processing pipelines (using libraries like Conduit or Pipes), a common failure occurs when an accumulator in a fold is not evaluated strictly. Instead of storing an integer, the heap fills with a massive chain of '1 + 1 + 1...' thunks, eventually triggering an Out of Memory (OOM) error.</p>",
    "root_cause": "The use of lazy 'foldl' instead of strict 'foldl'' on a long-running stream, causing thunk build-up in the accumulator.",
    "bad_code": "import Data.List (foldl)\n\n-- Processing a large stream lazily\nprocessStream :: [Int] -> Int\nprocessStream xs = foldl (\\acc x -> acc + x) 0 xs",
    "solution_desc": "Replace lazy folds with strict alternatives (foldl') and utilize 'BangPatterns' to force evaluation of the accumulator at each step. This ensures the result is reduced to a Normal Form immediately, preventing thunk growth.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nimport Data.List (foldl')\n\n-- Using strict fold and BangPatterns\nprocessStream :: [Int] -> Int\nprocessStream xs = foldl' (\\ !acc x -> acc + x) 0 xs",
    "verification": "Profile the executable using '+RTS -hc -p' to generate a heap profile. Ensure the 'RES' memory remains constant over time.",
    "date": "2026-03-11",
    "id": 1773191471,
    "type": "error"
});