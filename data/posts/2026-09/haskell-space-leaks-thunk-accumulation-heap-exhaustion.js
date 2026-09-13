window.onPostDataLoaded({
    "title": "Fixing Haskell Space Leaks from Lazy Accumulators",
    "slug": "haskell-space-leaks-thunk-accumulation-heap-exhaustion",
    "language": "Haskell",
    "code": "OutOfMemory",
    "tags": [
        "Haskell",
        "MemoryManagement",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Haskell relies on non-strict evaluation by default, deferring computations until their values are strictly demanded by an I/O boundary or a pattern match. When processing large data structures or streaming payloads, operations like <code>foldl</code> do not evaluate intermediate accumulator states immediately. Instead, the runtime environment constructs a linked tree of suspended computations known as thunks within the heap.</p><p>Because each thunk references parent data and functions, heap consumption grows linearly or factorially with input size without releasing garbage collection references. When evaluation is eventually triggered, traversing the deeply nested thunk chain causes call-stack exhaustion or triggers an unrecoverable out-of-memory killer invocation.</p>",
    "root_cause": "Using non-strict fold operations (e.g., standard Data.List.foldl) or lazy state monad accumulators that defer numeric/record evaluations, building a massive graph of unevaluated thunks on the managed heap.",
    "bad_code": "module Analytics where\n\n-- Lazy foldl accumulates unevaluated addition thunks on the heap\ncalculateTotalMetrics :: [Int] -> (Int, Int)\ncalculateTotalMetrics xs = foldl (\\(count, total) x -> (count + 1, total + x)) (0, 0) xs",
    "solution_desc": "Replace lazy reduction functions with their strict counterparts (such as Data.List.foldl'). Use BangPatterns (`!`) or the `seq` primitive to force evaluation to Weak Head Normal Form (WHNF) at each recursion step, preventing thunk chaining. For nested records, derive and invoke `deepseq` (`NFData`) to enforce full normal-form evaluation.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nmodule Analytics where\n\nimport Data.List (foldl')\n\n-- foldl' forces the accumulator tuple to WHNF at each iteration step\ncalculateTotalMetricsStrict :: [Int] -> (Int, Int)\ncalculateTotalMetricsStrict xs = foldl' step (0, 0) xs\n  where\n    step (!count, !total) !x = (count + 1, total + x)",
    "verification": "Compile the executable with profiling enabled: `ghc -prof -fprof-auto -rtsopts Main.hs`. Run with heap profiling active: `./Main +RTS -hc -p`. Convert the profile log to PostScript via `hp2ps -e8in -c Main.hp` and verify that the heap allocation graph remains constant O(1) rather than exhibiting linear unbounded climb.",
    "date": "2026-09-13",
    "id": 1789265271,
    "type": "error"
});