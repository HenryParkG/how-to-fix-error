window.onPostDataLoaded({
    "title": "Diagnosing Haskell Space Leaks in Thunk Chains",
    "slug": "diagnosing-haskell-space-leaks-thunks",
    "language": "Haskell",
    "code": "MemoryLeak",
    "tags": [
        "Python",
        "Backend",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's lazy evaluation can lead to space leaks when a series of transformations creates a massive chain of 'thunks' (unevaluated expressions) in memory. Instead of storing the computed result (e.g., an integer), the heap stores the entire history of the calculation, eventually causing an Out-Of-Memory (OOM) error.</p>",
    "root_cause": "Accumulation of thunks in long-running recursive functions or folds that do not force evaluation of their accumulators.",
    "bad_code": "-- The accumulator 'acc' is never forced, building a thunk chain\nsumList :: [Int] -> Int\nsumList = foldl (\\acc x -> acc + x) 0",
    "solution_desc": "Use strict versions of higher-order functions (like foldl') or apply BangPatterns (!) to force the evaluation of accumulators at each recursive step.",
    "good_code": "-- Using foldl' (strict version) or BangPatterns to force evaluation\nimport Data.List (foldl')\n\nsumListStrict :: [Int] -> Int\nsumListStrict = foldl' (+) 0",
    "verification": "Compile with '-with-rtsopts=-s' and monitor the 'maximum residency' in the generated GC statistics.",
    "date": "2026-03-09",
    "id": 1773039096,
    "type": "error"
});