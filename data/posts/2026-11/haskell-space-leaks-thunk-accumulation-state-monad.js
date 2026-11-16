window.onPostDataLoaded({
    "title": "Fixing Haskell Space Leaks in State Monad Pipelines",
    "slug": "haskell-space-leaks-thunk-accumulation-state-monad",
    "language": "Rust",
    "code": "OutOfMemoryError",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Haskell uses lazy evaluation by default, which can cause subtle space leaks in long-running stateful computations. When using the lazy State monad from <code>Control.Monad.Trans.State.Lazy</code>, intermediate state updates are not evaluated to weak head normal form (WHNF) or normal form. Instead, the runtime builds a directed acyclic graph of unevaluated thunks.</p><p>In iterative loops or recursive tail calls over large datasets, the thunk graph expands linearly in memory with each iteration. Because the actual value is deferred, the GHC garbage collector cannot reclaim intermediate structures. When an output operation or termination check finally forces the accumulator, GHC traverses the massive thunk chain on the runtime call stack, causing an out-of-memory crash or stack overflow.</p>",
    "root_cause": "Accumulating unevaluated thunks inside lazy State monad transitions (`modify`) without forcing evaluation between recursive iterations.",
    "bad_code": "import Control.Monad.Trans.State.Lazy\nimport Control.Monad (forM_)\n\ntype Metrics = (Int, Double)\n\n-- Accumulates a massive thunk tree on the heap\nprocessTransactions :: [Double] -> State Metrics ()\nprocessTransactions values = do\n  forM_ values $ \\val -> do\n    modify (\\(count, total) -> (count + 1, total + val))\n\nrunPipeline :: [Double] -> Metrics\nrunPipeline txs = execState (processTransactions txs) (0, 0.0)",
    "solution_desc": "Switch from the lazy State monad to the strict variant (`Control.Monad.Trans.State.Strict`). Replace lazy `modify` with `modify'`, and use strict record types with bang patterns (`!`) or the `DeepSeq` typeclass (`force` / `$!!`) to force strict evaluation of primitive accumulators across each monadic step.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\n\nimport Control.Monad.Trans.State.Strict\nimport Control.Monad (foldM_)\n\ndata Metrics = Metrics\n  { mCount :: !Int\n  , mTotal :: !Double\n  }\n\nprocessTransactionsStrict :: [Double] -> State Metrics ()\nprocessTransactionsStrict values = do\n  foldM_ (\\_ val -> modify' (\\(Metrics !c !t) -> Metrics (c + 1) (t + val)))\n         ()\n         values\n\nrunPipeline :: [Double] -> Metrics\nrunPipeline txs = execState (processTransactionsStrict txs) (Metrics 0 0.0)",
    "verification": "Compile the application with profiling enabled (`ghc -prof -fprof-auto -rtsopts Main.hs`) and execute with heap profiling flags (`./Main +RTS -hy -p`). Convert the resulting output using `hp2ps` to confirm flat constant-space $O(1)$ memory consumption over multi-million item batches.",
    "date": "2026-11-16",
    "id": 1794801467,
    "type": "error"
});