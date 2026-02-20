window.onPostDataLoaded({
    "title": "Diagnosing Haskell Space Leaks in Lazy Pipelines",
    "slug": "diagnosing-haskell-space-leaks-lazy-evaluation",
    "language": "Haskell",
    "code": "SPACE_LEAK",
    "tags": [
        "Backend",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's lazy evaluation strategy can lead to 'space leaks' where the runtime builds up a massive chain of unevaluated expressions, known as thunks. In high-throughput data pipelines, these thunks consume the heap until the process hits an Out-Of-Memory (OOM) error, even if the actual data being processed is small. This is particularly common when using lazy folds on long-lived state.</p>",
    "root_cause": "Accumulation of unevaluated thunks in the heap due to non-strict evaluation of recursive accumulators.",
    "bad_code": "-- Standard lazy fold builds a massive thunk\nsumList :: [Int] -> Int\nsumList = foldl (\\acc x -> acc + x) 0",
    "solution_desc": "Switch to strict evaluation using the strict version of fold (foldl') and use BangPatterns to force evaluation of the accumulator at each step.",
    "good_code": "import Data.List (foldl')\n\n-- foldl' forces the evaluation of the accumulator\nsumListStrict :: [Int] -> Int\nsumListStrict = foldl' (\\acc x -> acc + x) 0",
    "verification": "Run the program with GHC profiling enabled (+RTS -s) and monitor the 'Total Memory In Use' metric.",
    "date": "2026-02-20",
    "id": 1771562602,
    "type": "error"
});