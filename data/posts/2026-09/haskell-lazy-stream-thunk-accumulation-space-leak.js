window.onPostDataLoaded({
    "title": "Haskell: Fixing Lazy Stream Thunk Accumulation & Leaks",
    "slug": "haskell-lazy-stream-thunk-accumulation-space-leak",
    "language": "Haskell",
    "code": "SpaceLeak",
    "tags": [
        "Haskell",
        "FunctionalProgramming",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>In Haskell, non-strict evaluation defers computation until values are demanded by IO or pattern matching. When processing continuous data streams, lazy folds or accumulator structures can silently construct massive graphs of unevaluated expressions called thunks on the heap.</p><p>Instead of computing running statistics in constant space $O(1)$, the runtime retains references to intermediate thunks, preventing garbage collection. Over time, this leads to an unbounded heap allocation leak, degrading garbage collector pause times and ultimately terminating the process with an out-of-memory fault.</p>",
    "root_cause": "Lazy left-folds (such as standard `foldl`) and unforced record fields defer evaluation by accumulating nested closures in memory, delaying normalization until stream termination or observation.",
    "bad_code": "module StreamProcessor where\n\nimport Data.List (foldl)\n\ndata Metrics = Metrics { totalCount :: Int, runningSum :: Double }\n\n-- Bug: Standard lazy foldl builds a nested thunk chain on every stream item\ncalculateAverages :: [Double] -> Double\ncalculateAverages stream =\n    let (Metrics count total) = foldl step (Metrics 0 0.0) stream\n    in total / fromIntegral count\n  where\n    step (Metrics c s) x = Metrics (c + 1) (s + x)",
    "solution_desc": "Use strict evaluation mechanisms such as `Data.List.foldl'`, enable the `BangPatterns` extension, or mark algebraic data type record fields with strictness flags (`!`). When handling streaming architectures, adopt libraries like `conduit` or `pipes` to guarantee constant memory streaming.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nmodule StreamProcessor where\n\nimport Data.List (foldl')\n\n-- Enforce strict evaluation of record fields to prevent thunk retention\ndata Metrics = Metrics !Int !Double\n\ncalculateAverages :: [Double] -> Double\ncalculateAverages stream =\n    let !(Metrics count total) = foldl' step (Metrics 0 0.0) stream\n    in if count == 0 then 0.0 else total / fromIntegral count\n  where\n    step !(Metrics c s) !x = Metrics (c + 1) (s + x)",
    "verification": "Compile with profiling options (`ghc -prof -fprof-auto -rtsopts Main.hs`) and run with `./Main +RTS -hy -p`. Inspect the resulting `Main.hp` heap profile using `hp2ps` to confirm constant heap residency instead of linear thunk growth.",
    "date": "2026-09-03",
    "id": 1788401413,
    "type": "error"
});