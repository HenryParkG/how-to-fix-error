window.onPostDataLoaded({
    "title": "Hunting Haskell Space Leaks: Thunk Accumulation in Lazy Evaluation Pipelines",
    "slug": "hunting-haskell-space-leaks-thunk-accumulation",
    "language": "Haskell",
    "code": "OutOfMemoryError",
    "tags": [
        "Haskell",
        "Functional Programming",
        "Performance",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>Haskell uses call-by-need lazy evaluation by default. Instead of computing the result of an expression immediately, the runtime allocates a heap object called a <em>thunk</em> representing the deferred computation. While laziness allows modular infinite structures and avoids unnecessary computations, it introduces catastrophic memory regressions known as <strong>space leaks</strong> when computations build chains of thunks instead of reducing to values.</p><p>A classic failure point occurs during large iterative folds or stateful pipelines. When intermediate states are not forced into Weak Head Normal Form (WHNF), thunks accumulate linearly with input size until the process exhausts available memory and terminates with an OOM abort.</p>",
    "root_cause": "Unforced lazy accumulators building massive graphs of suspended computations (thunks) on the GHC heap rather than evaluating results strictly at each iteration step.",
    "bad_code": "module Analytics where\n\n-- Standard foldl keeps unevaluated expressions in 'acc'\ncomputeMetrics :: [Int] -> (Int, Int)\ncomputeMetrics xs = foldl step (0, 0) xs\n  where\n    step (count, total) x = (count + 1, total + x)\n\n-- Running this with a large list builds millions of (+ 1) and (+ x) thunks:\n-- main = print $ computeMetrics [1..10000000]",
    "solution_desc": "Replace lazy reduction primitives with strict left-folds (foldl'), enforce strict evaluation on tuple components using BangPatterns or strict data records, and unpack primitive fields to eradicate thunk allocation entirely.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nmodule Analytics where\n\nimport Data.List (foldl')\n\n-- Data type with strict unpacked fields eliminates all thunks\ndata Metrics = Metrics {-# UNPACK #-} !Int {-# UNPACK #-} !Int\n\ncomputeMetricsStrict :: [Int] -> Metrics\ncomputeMetricsStrict = foldl' step (Metrics 0 0)\n  where\n    step (Metrics !c !t) !x = Metrics (c + 1) (t + x)\n\n-- Alternative with strict pair BangPatterns\ncomputeMetricsTuple :: [Int] -> (Int, Int)\ncomputeMetricsTuple = foldl' (\\(!c, !t) !x -> (c + 1, t + x)) (0, 0)",
    "verification": "Compile with profiling enabled: `ghc -prof -fprof-auto -rtsopts Main.hs` and run with `+RTS -hy -p` to inspect the heap profile using `hp2ps` or `profiteur`. A healthy strict pipeline exhibits a flat heap profile instead of a monotonic linear ramp.",
    "date": "2026-10-17",
    "id": 1792203052,
    "type": "error"
});