window.onPostDataLoaded({
    "title": "Fixing Haskell Streaming Space Leaks",
    "slug": "fixing-haskell-streaming-space-leaks",
    "language": "Haskell",
    "code": "Thunk Accumulation",
    "tags": [
        "Go",
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's default evaluation model is lazy, which defers calculations by representing them as memory allocations called 'thunks' (unevaluated expressions). While highly powerful, in long-running streaming pipelines, this can lead to catastrophic space leaks. If an accumulator state is modified iteratively without being forced, Haskell builds a massive, nested chain of thunks rather than computing the intermediate values. Over hours or days of continuous data streaming, this unevaluated graph grows until physical memory is completely exhausted, triggering an OOM crash. This is particularly prevalent when using loose tuple states or lazy list accumulators inside stream pipelines.</p>",
    "root_cause": "Use of lazy reduction operators (such as foldl) and un-strict tuples in pipeline states, resulting in the preservation of unevaluated expressions (thunks) on the heap instead of immediate value reduction.",
    "bad_code": "module Pipeline where\n\n-- Lazy accumulator accumulates thunks over large streams\nprocessPipeline :: [Int] -> (Int, Int)\nprocessPipeline xs = foldl (\\(count, accSum) x -> (count + 1, accSum + x)) (0, 0) xs",
    "solution_desc": "Switch to strict reductions using the strict left fold (`foldl'`), apply strict annotations/bang patterns (`!`) to enforce structural evaluation, and utilize strict data types for accumulator states to prevent the build-up of deferred evaluations.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nmodule PipelineStrict where\n\nimport Data.List (foldl')\n\n-- Strict accumulator ensures constant space complexity\nprocessPipeline :: [Int] -> (Int, Int)\nprocessPipeline xs = foldl' (\\(!count, !accSum) x -> (count + 1, accSum + x)) (0, 0) xs",
    "verification": "Compile the binary with profiling enabled (`ghc -prof -fprof-auto -rtsopts PipelineStrict.hs`). Run the program with heap profiling options: `./PipelineStrict +RTS -hc -p`. Use `hp2ps -c PipelineStrict.hp` to generate a PostScript graph and verify that the heap usage remains flat over time.",
    "date": "2026-07-17",
    "id": 1784284218,
    "type": "error"
});