window.onPostDataLoaded({
    "title": "Fixing Haskell Thunk Memory Leaks & Space Blowup",
    "slug": "haskell-lazy-evaluation-thunk-space-leaks",
    "language": "Rust",
    "code": "HeapBlowup / SpaceLeak",
    "tags": [
        "Rust",
        "Backend",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's default lazy evaluation defers expressions into memory structures known as thunks. When accumulating values over large datasets using standard lazy folds or unbounded structures, unevaluated thunk chains accumulate in the heap, resulting in linear memory growth and catastrophic garbage collection pause times.</p><p>Resolving space leaks requires forcing accumulator expressions into Weak Head Normal Form (WHNF) or Normal Form (NF) using strict evaluation primitives like <code>seq</code>, strict accumulators (<code>foldl'</code>), or strict data types with bang patterns (<code>!</code>).</p>",
    "root_cause": "Using the non-strict `foldl` on collections causes accumulator expressions to expand into a massive graph of unresolved suspension thunks on the heap instead of computing intermediate values eagerly.",
    "bad_code": "module Main where\n\n-- Leaks memory: foldl builds an O(N) thunk tree before reduction\ncomputeSumStats :: [Double] -> (Double, Double)\ncomputeSumStats xs = foldl (\\(count, acc) x -> (count + 1, acc + x)) (0, 0) xs\n\nmain :: IO ()\nmain = do\n  let dataset = [1.0 .. 10000000.0]\n  print $ computeSumStats dataset",
    "solution_desc": "Replace lazy reduction functions with strict counterparts like `Data.List.foldl'`, enforce strict fields in record structures, or apply BangPatterns to force WHNF evaluation at every step of computation.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nmodule Main where\n\nimport Data.List (foldl')\n\n-- Strict evaluation: accumulators are reduced to WHNF on each step\ncomputeSumStats :: [Double] -> (Double, Double)\ncomputeSumStats = foldl' (\\(!count, !acc) x -> (count + 1.0, acc + x)) (0.0, 0.0)\n\nmain :: IO ()\nmain = do\n  let dataset = [1.0 .. 10000000.0]\n  print $ computeSumStats dataset",
    "verification": "Compile with GHC profiling flags `ghc -O2 -prof -fprof-auto -rtsopts Main.hs` and run `./Main +RTS -hy -p` to inspect heap profiling graph via `hp2ps` and confirm constant memory footprint.",
    "date": "2026-08-29",
    "id": 1787979217,
    "type": "error"
});