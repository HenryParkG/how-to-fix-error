window.onPostDataLoaded({
    "title": "Fixing Haskell Space Leaks in Lazy Thunk Chains",
    "slug": "haskell-space-leaks-lazy-evaluation",
    "language": "Haskell",
    "code": "MemoryLeak",
    "tags": [
        "TypeScript",
        "Backend",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's lazy evaluation means that expressions are not evaluated until their results are needed. Instead, the runtime creates 'thunks' (pointers to computations). In long recursive operations or folds, these thunks can build up into massive chains in the heap, consuming all available memory before they are finally evaluated.</p>",
    "root_cause": "Building large chains of unevaluated computations (thunks) instead of performing immediate reduction in tail-recursive functions.",
    "bad_code": "-- This builds a massive thunk chain: (((0 + 1) + 2) + ...)\nsumList :: [Int] -> Int\nsumList = foldl (+) 0",
    "solution_desc": "Use strict versions of functions (e.g., foldl') and the BangPatterns extension to force evaluation at each step, preventing thunk build-up.",
    "good_code": "import Data.List (foldl')\n\n-- foldl' forces evaluation of the accumulator at each step\nsumListStrict :: [Int] -> Int\nsumListStrict = foldl' (+) 0",
    "verification": "Compile with `-rtsopts` and run the executable with `+RTS -s` to inspect the maximum heap residency and GC statistics.",
    "date": "2026-04-29",
    "id": 1777459623,
    "type": "error"
});