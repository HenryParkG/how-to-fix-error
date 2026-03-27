window.onPostDataLoaded({
    "title": "Fixing Haskell Space Leaks in Lazy Thunks",
    "slug": "resolving-haskell-space-leaks-thunks",
    "language": "Haskell",
    "code": "HeapOverflow",
    "tags": [
        "Haskell",
        "Functional",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's lazy evaluation is a double-edged sword. While it allows for infinite data structures, it often leads to 'space leaks' where expressions (thunks) are stored in memory instead of being evaluated. This occurs frequently in recursive folds where the accumulator builds a massive chain of deferred operations, eventually exhausting the heap or stack.</p>",
    "root_cause": "The default foldl function creates a long chain of unevaluated thunks in the heap because it doesn't force evaluation of the accumulator at each step.",
    "bad_code": "sumList :: [Int] -> Int\nsumList = foldl (+) 0\n-- For a million elements, this creates a thunk: (((0 + 1) + 2) + ...)",
    "solution_desc": "Replace lazy folds with strict versions like foldl' from Data.List, or use BangPatterns to force evaluation of function arguments before they are stored.",
    "good_code": "import Data.List (foldl')\n\nsumListStrict :: [Int] -> Int\nsumListStrict = foldl' (+) 0\n-- foldl' forces the evaluation of (acc + x) at every step.",
    "verification": "Compile with GHC profiling enabled (-prof -fprof-auto) and run with +RTS -hc to verify flat memory usage in the heap profile.",
    "date": "2026-03-27",
    "id": 1774594693,
    "type": "error"
});