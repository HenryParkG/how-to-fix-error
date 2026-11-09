window.onPostDataLoaded({
    "title": "Diagnose Haskell Lazy Space Leaks and Thunks",
    "slug": "diagnosing-haskell-space-leaks-thunk-accumulation",
    "language": "Haskell",
    "code": "SpaceLeak",
    "tags": [
        "Haskell",
        "Rust",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In Haskell, expressions are not evaluated immediately upon binding; instead, the runtime system constructs a heap-allocated graph node known as a <strong>thunk</strong> (suspension). When functions process large structures lazily, successive transformations can create deeply nested chains of unevaluated thunks.</p><p>A space leak occurs when these thunk graphs accumulate in the heap faster than they are reduced to Weak Head Normal Form (WHNF). This leads to excessive resident set size (RSS), prolonged garbage collection pauses, and eventual <code>OutOfMemory</code> termination. Standard profiling tools like GHC's <code>+RTS -hy</code> or <code>eventlog</code> reveal characteristic 'sawtooth' memory profiles collapsing only when forced, or steep monotonic inclines ending in crash.</p>",
    "root_cause": "Accumulators in recursive or folding operations are retained as unevaluated thunk expressions (e.g., standard `foldl`) rather than evaluated iteratively, retaining heap references to intermediate values.",
    "bad_code": "module Analytics where\n\n-- Buggy: foldl creates a thunk chain of additions O(N) in memory\ncalculateMetrics :: [Int] -> (Int, Int)\ncalculateMetrics xs = foldl (\\(count, total) x -> (count + 1, total + x)) (0, 0) xs\n\nprocessLargeFeed :: [Int] -> IO ()\nprocessLargeFeed stream = do\n    let (count, total) = calculateMetrics stream\n    print count\n    print total",
    "solution_desc": "Replace lazy folds with strict alternatives such as `Data.List.foldl'`, enforce eager evaluation of accumulator tuples using BangPatterns (`!`), or define a strict data type. This collapses computations to WHNF immediately at each iteration, preserving O(1) space complexity.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nmodule Analytics where\n\nimport Data.List (foldl')\n\ndata Metrics = Metrics !Int !Int\n\n-- Fixed: Strict accumulator evaluated at every fold step\ncalculateMetrics :: [Int] -> (Int, Int)\ncalculateMetrics xs = \n    let (Metrics count total) = foldl' (\\(Metrics !c !t) !x -> Metrics (c + 1) (t + x)) (Metrics 0 0) xs\n    in (count, total)\n\nprocessLargeFeed :: [Int] -> IO ()\nprocessLargeFeed stream = do\n    let (count, total) = calculateMetrics stream\n    print count\n    print total",
    "verification": "Compile with `ghc -prof -fprof-auto -rtsopts Main.hs` and run with `./Main +RTS -s -hc -p`. Verify in the generated `.hp` graph that heap residency remains flat and constant regardless of list size.",
    "date": "2026-11-09",
    "id": 1794236117,
    "type": "error"
});