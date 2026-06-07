window.onPostDataLoaded({
    "title": "Fixing Haskell Space Leaks: Thunk Accumulation",
    "slug": "fixing-haskell-space-leaks-thunk-accumulation",
    "language": "Haskell",
    "code": "SpaceLeak",
    "tags": [
        "Haskell",
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's non-strict evaluation means expressions are not evaluated until their results are needed. Instead, they are represented as heap-allocated graph structures called 'thunks'. If a long-running recursive process continually builds up these unevaluated computations (such as aggregate state counters), memory consumption will grow linearly with the volume of processed data. This eventually results in massive Out-of-Memory (OOM) crashes and high garbage collection latency.</p>",
    "root_cause": "Using a lazy left fold (foldl) over a large list. The execution engine defers evaluation of the accumulator, building up a nested tree of arithmetic thunks in the heap instead of immediately reducing the values.",
    "bad_code": "sumLazy :: Num a => [a] -> a\nsumLazy = foldl (+) 0",
    "solution_desc": "Convert the lazy evaluation to strict evaluation by utilizing foldl' from Data.List. This forces intermediate accumulator evaluations to Weak Head Normal Form (WHNF) at each step of the recursion.",
    "good_code": "import Data.List (foldl')\n\nsumStrict :: Num a => [a] -> a\nsumStrict = foldl' (+) 0",
    "verification": "Compile the code using GHC profiling flags: 'ghc -prof -fprof-auto -rtsopts'. Execute the binary with '+RTS -hc -p' to generate a heap profile, and use 'hp2ps' to confirm that memory usage scales as O(1) instead of O(n).",
    "date": "2026-06-07",
    "id": 1780830231,
    "type": "error"
});