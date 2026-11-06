window.onPostDataLoaded({
    "title": "Debugging Haskell Space Leaks & Thunk Accumulation",
    "slug": "debugging-haskell-space-leaks-thunk-accumulation",
    "language": "Haskell",
    "code": "SpaceLeakOutOfMemory",
    "tags": [
        "Docker",
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Haskell, non-strict evaluation defers computations until their values are demanded by creating references called thunks. When recursive aggregations or long-lived state transformations defer evaluation without reducing values to Weak Head Normal Form (WHNF) or Normal Form (NF), thunk chains accumulate silently in the heap.</p><p>This causes subtle space leaks where memory consumption grows linearly with input size despite seemingly constant-space logic. Eventually, the garbage collector exhausts its allocated generation boundaries, leading to thrashing, high CPU pause times, and fatal runtime OOM termination.</p>",
    "root_cause": "Using lazy fold functions (like foldl) or lazy state record fields accumulates nested computation thunks on the heap rather than evaluating immediate primitive representations during each iteration.",
    "bad_code": "module Aggregator where\n\n-- Lazy foldl accumulates an unevaluated thunk tree: (((0 + x1) + x2) + ...)\ncalculateMetrics :: [Int] -> (Int, Int)\ncalculateMetrics = foldl (\\(count, total) x -> (count + 1, total + x)) (0, 0)",
    "solution_desc": "Replace lazy folds with strict variants such as `Data.List.foldl'`, enforce strict record fields with the `BangPatterns` extension, and use the `deepseq` library (`NFData`) to guarantee evaluation to normal form.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nmodule Aggregator where\n\nimport Data.List (foldl')\n\n-- Strict evaluation forces accumulator to WHNF at each step\ncalculateMetricsStrict :: [Int] -> (Int, Int)\ncalculateMetricsStrict = foldl' step (0, 0)\n  where\n    step (!count, !total) !x = (count + 1, total + x)",
    "verification": "Compile with `-prof -fprof-auto -rtsopts` and run the binary using `+RTS -hy -p` to generate a heap profiling graph. Verify in the resulting `.hp` file via `hp2ps` that memory usage remains constant over time.",
    "date": "2026-11-06",
    "id": 1793938808,
    "type": "error"
});