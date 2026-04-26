window.onPostDataLoaded({
    "title": "Resolving Haskell Space Leaks in Lazy Stream Evaluation",
    "slug": "haskell-lazy-stream-space-leaks",
    "language": "Haskell",
    "code": "MemoryLeak (SpaceLeak)",
    "tags": [
        "Go",
        "Backend",
        "Haskell",
        "Error Fix"
    ],
    "analysis": "<p>In Haskell, lazy evaluation is a powerful feature that allows for infinite data structures, but it can lead to 'space leaks' where memory is consumed by unindexed thunks (unevaluated expressions). When processing streams, if the accumulator in a recursive function or fold is not forced to evaluate, Haskell builds a massive chain of operations in memory instead of the actual result.</p>",
    "root_cause": "The use of lazy 'foldl' or recursive functions that build up thunks in the heap, causing memory usage to grow linearly with stream size until the final result is demanded.",
    "bad_code": "sumList :: [Int] -> Int\nsumList = foldl (+) 0 -- This builds a thunk: (((0 + 1) + 2) + ...)",
    "solution_desc": "Switch to the strict version 'foldl'' from Data.List or use BangPatterns to force evaluation of the accumulator at each step, preventing the growth of the thunk chain.",
    "good_code": "import Data.List (foldl')\n\nsumListStrict :: [Int] -> Int\nsumListStrict = foldl' (+) 0 -- foldl' forces evaluation of the result at each step",
    "verification": "Compile with GHC profiling (-prof -fprof-auto) and run with +RTS -hc to generate a heap profile. Ensure the heap graph remains constant (O(1) space) instead of showing a 'mountain' shape.",
    "date": "2026-04-26",
    "id": 1777196709,
    "type": "error"
});