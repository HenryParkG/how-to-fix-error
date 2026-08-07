window.onPostDataLoaded({
    "title": "Fix Haskell GHC Lazy Space Leaks in Streaming Pipelines",
    "slug": "fix-haskell-ghc-lazy-space-leak-streaming",
    "language": "Haskell",
    "code": "HeapOverflow",
    "tags": [
        "Haskell",
        "Streaming",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Lazy evaluation in Haskell streaming pipelines (such as Conduit or Pipes combined with Monad Transformers) can create un-evaluated thunk chains within state monads over prolonged data streams. Over time, accumulated unevaluated expressions inflate GHC heap usage, resulting in space leaks and eventual out-of-memory crashes.</p>",
    "root_cause": "Using non-strict state monad transformers (e.g. Control.Monad.Trans.State.Lazy) or non-strict monadic state updates (`modify` instead of `modify'`) accumulates unevaluated thunks across stream element transformations.",
    "bad_code": "import Control.Monad.Trans.State.Lazy -- Bug: Lazy State Transformer!\nimport Data.Conduit\n\nsumStream :: Monad m => ConduitT Int Void (StateT Int m) ()\nsumStream = awaitForever $ \\n -> do\n  modify (\\acc -> acc + n) -- Accumulates thunks lazily",
    "solution_desc": "Switch to strict monad transformers (`Control.Monad.Trans.State.Strict`), use strict monadic modifier functions (`modify'`), and enforce Weak Head Normal Form (WHNF) evaluation with bang patterns.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nimport Control.Monad.Trans.State.Strict -- Strict State Transformer\nimport Data.Conduit\n\nsumStream :: Monad m => ConduitT Int Void (StateT Int m) ()\nsumStream = awaitForever $ \\n -> do\n  modify' (\\ !acc -> acc + n) -- Forces immediate evaluation",
    "verification": "Compile with runtime profiling flags `-prof -fprof-auto -hy` and generate heap profile graphs using `hp2ps` to confirm constant O(1) space consumption throughout stream lifetime.",
    "date": "2026-08-07",
    "id": 1786096320,
    "type": "error"
});