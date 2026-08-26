window.onPostDataLoaded({
    "title": "Resolving Haskell Space Leaks from Lazy Accumulators",
    "slug": "haskell-space-leak-lazy-evaluation-fix",
    "language": "Haskell",
    "code": "OutOfMemory / HeapOverflow",
    "tags": [
        "Backend",
        "Rust",
        "Node.js",
        "Error Fix"
    ],
    "analysis": "<p>Haskell relies on call-by-need (lazy) evaluation by default. Instead of computing expressions immediately, the runtime allocates a graph node known as a <strong>thunk</strong> (unevaluated computation). While laziness enables infinite data structures and modular compositional pipelines, it can produce catastrophic <em>space leaks</em> when accumulators in recursive loops or folds are not strictly evaluated.</p><p>Using standard lazy <code>foldl</code> builds an unbounded chain of unevaluated thunks (e.g., <code>(((0 + 1) + 2) + 3)...</code>) on the heap. When the result is finally demanded, evaluating the deeply nested thunk chain exhausts heap or stack memory.</p>",
    "root_cause": "Unforced thunk accumulation in non-strict fold functions (`foldl`) and lazy data constructor fields leading to massive heap allocations.",
    "bad_code": "module Main where\n\n-- Buggy: foldl is lazy and creates a huge chain of thunks\nsumValues :: [Int] -> Int\nsumValues xs = foldl (+) 0 xs\n\n-- Lazy record fields keep thunks alive in long-running state\ndata Metrics = Metrics {\n    totalRequests :: Integer,\n    totalBytes    :: Integer\n}\n\nupdateMetrics :: Metrics -> Integer -> Metrics\nupdateMetrics (Metrics reqs bytes) n =\n    Metrics (reqs + 1) (bytes + n)",
    "solution_desc": "Use strict left folds (`Data.List.foldl'`), enable the BangPatterns extension, and enforce strict fields in data types using strictness annotations (`!`).",
    "good_code": "{-# LANGUAGE BangPatterns #-}\n\nmodule Main where\n\nimport Data.List (foldl')\n\n-- Fix 1: foldl' strictly evaluates intermediate accumulator values to WHNF\nsumValues :: [Int] -> Int\nsumValues xs = foldl' (+) 0 xs\n\n-- Fix 2: Strict fields ensure values are evaluated before storage\ndata Metrics = Metrics {\n    totalRequests :: !Integer,\n    totalBytes    :: !Integer\n} deriving (Show)\n\nupdateMetrics :: Metrics -> Integer -> Metrics\nupdateMetrics (!Metrics !reqs !bytes) !n =\n    Metrics (reqs + 1) (bytes + n)",
    "verification": "Compile with profiling options: `ghc -prof -fprof-auto -rtsopts Main.hs` and run with `./Main +RTS -hc -p` to inspect the `.hp` heap profile using `hp2ps -c Main.hp` to confirm constant memory usage.",
    "date": "2026-08-26",
    "id": 1787715927,
    "type": "error"
});