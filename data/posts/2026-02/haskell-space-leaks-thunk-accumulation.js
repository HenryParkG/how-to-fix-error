window.onPostDataLoaded({
    "title": "Haskell Space Leaks: Fixing Thunk Accumulation",
    "slug": "haskell-space-leaks-thunk-accumulation",
    "language": "Haskell",
    "code": "SpaceLeak",
    "tags": [
        "Backend",
        "Haskell",
        "MemoryManagement",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's lazy evaluation is a double-edged sword. While it allows for infinite data structures and modular code, it frequently leads to 'space leaks' where the runtime builds up a massive chain of unevaluated computations known as thunks. Instead of storing the result of a calculation (like an integer), the heap stores the recipe to calculate it, which consumes significantly more memory and can eventually lead to a stack overflow or OOM (Out of Memory) error during evaluation.</p>",
    "root_cause": "The use of non-strict functions (like foldl) on large data structures, causing the accumulation of unevaluated expressions in the heap instead of immediate reduction to Weak Head Normal Form (WHNF).",
    "bad_code": "sumList :: [Int] -> Int\nsumList xs = foldl (\\acc x -> acc + x) 0 xs\n-- This builds a thunk: (((0 + x1) + x2) + x3) ...",
    "solution_desc": "Replace lazy folds with strict variants (foldl') and utilize 'Bang Patterns' to force evaluation of accumulator arguments at each step, ensuring the heap stores values rather than thunks.",
    "good_code": "import Data.List (foldl')\n\nsumListStrict :: [Int] -> Int\nsumListStrict xs = foldl' (\\acc x -> acc + x) 0 xs\n-- foldl' forces evaluation of the accumulator at each step.",
    "verification": "Run the program with GHC's profiling tools: 'ghc -prof -fprof-auto -rtsopts' and analyze the heap profile using '+RTS -hc'.",
    "date": "2026-02-14",
    "id": 1771043297,
    "type": "error"
});