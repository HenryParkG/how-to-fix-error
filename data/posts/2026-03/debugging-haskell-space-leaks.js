window.onPostDataLoaded({
    "title": "Debugging Haskell Space Leaks in Lazy Pipelines",
    "slug": "debugging-haskell-space-leaks",
    "language": "Haskell",
    "code": "Space Leak (Thunk accumulation)",
    "tags": [
        "Rust",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's non-strict evaluation is a powerful abstraction, but it often leads to 'space leaks' where expressions (thunks) are stored in memory instead of being evaluated immediately. This causes the heap to grow linearly even for simple aggregations, eventually leading to Out Of Memory (OOM) errors or excessive Garbage Collection pressure that degrades throughput.</p>",
    "root_cause": "The use of lazy left-folds or non-strict data structures in recursive functions, causing a chain of unevaluated computations to build up in the heap.",
    "bad_code": "sumList :: [Int] -> Int\nsumList = foldl (+) 0\n-- foldl builds a massive thunk: (((0 + 1) + 2) + 3) ...",
    "solution_desc": "Switch to the strict version of the fold function (foldl') and use bang patterns (!) to force evaluation of accumulator variables at each step.",
    "good_code": "import Data.List (foldl')\n\nsumListStrict :: [Int] -> Int\nsumListStrict = foldl' (+) 0\n-- foldl' evaluates the result at each step",
    "verification": "Compile with '-prof -fprof-auto' and run with '+RTS -hc' to generate a heap profile graph (hp2ps).",
    "date": "2026-03-08",
    "id": 1772932584,
    "type": "error"
});