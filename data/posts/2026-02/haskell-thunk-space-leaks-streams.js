window.onPostDataLoaded({
    "title": "Fixing Haskell Thunk-Induced Space Leaks in Streams",
    "slug": "haskell-thunk-space-leaks-streams",
    "language": "Haskell",
    "code": "SpaceLeak",
    "tags": [
        "Go",
        "Functional",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's lazy evaluation can lead to 'space leaks' where the runtime builds a massive chain of unevaluated computations (thunks) instead of computing a value. In long-running streams, using lazy folds like <code>foldl</code> causes the heap to grow linearly with the number of processed elements because the accumulator is never reduced to Normal Form.</p><p>This eventually leads to a stack overflow or the OOM killer terminating the process, even though the logic seems constant-space.</p>",
    "root_cause": "Use of lazy accumulator functions in a recursive stream context, preventing the Garbage Collector from reclaiming intermediate state.",
    "bad_code": "processStream :: [Int] -> Int\nprocessStream xs = foldl (\\acc x -> acc + x) 0 xs -- Accumulates thunks",
    "solution_desc": "Switch to strict evaluation using the `foldl'` function from Data.List or use the BangPatterns extension to force evaluation of the accumulator at each step.",
    "good_code": "import Data.List (foldl')\n\nprocessStream :: [Int] -> Int\nprocessStream xs = foldl' (\\acc x -> acc + x) 0 xs -- Forces evaluation",
    "verification": "Profile the executable using '+RTS -hy' to generate a heap profile. A 'sawtooth' pattern indicates healthy GC, while a linear 'fin' indicates a leak.",
    "date": "2026-02-24",
    "id": 1771908465,
    "type": "error"
});