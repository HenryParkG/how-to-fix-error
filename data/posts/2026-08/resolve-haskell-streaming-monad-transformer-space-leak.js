window.onPostDataLoaded({
    "title": "Resolving Haskell Space Leaks in Streaming Monads",
    "slug": "resolve-haskell-streaming-monad-transformer-space-leak",
    "language": "Haskell",
    "code": "Space Leak / OOM",
    "tags": [
        "Haskell",
        "Functional Programming",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In long-running stream processing pipelines using monadic transformer stacks (such as <code>StateT</code> combined with <code>Conduit</code> or <code>Stream</code>), memory consumption can continuously grow over time. This classic Haskell space leak is caused by unevaluated monadic thunks accumulating inside the state transformer layer across millions of streamed events.</p><p>Because standard monad transformers default to lazy state evaluation, calls to <code>modify</code> create a chain of unevaluated computations in the heap, causing GHC garbage collection overhead to skyrocket until the process crashes due to out-of-memory (OOM) errors.</p>",
    "root_cause": "Use of lazy state transformers (`Control.Monad.Trans.State.Lazy`) instead of strict variants (`Control.Monad.Trans.State.Strict`), alongside missing pattern strictness annotations on accumulated stream state types.",
    "bad_code": "module StreamProcessor where\n\nimport Control.Monad.Trans.State.Lazy -- Lazy Monad Transformer causes space leak!\nimport Data.Conduit\nimport qualified Data.Conduit.List as CL\n\nprocessStream :: Monad m => ConduitT Int Int (StateT Int m) ()\nprocessStream = CL.mapM $ \\x -> do\n    modify (\\s -> s + x) -- Unevaluated thunk accumulates here!\n    return x",
    "solution_desc": "Replace lazy transformer modules with their strict counterparts (`Control.Monad.Trans.State.Strict`), enforce strict data fields using BangPatterns (`!`), and use strict evaluation operators (`modify'`) to force immediate thunk evaluation at each stream iteration step.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nmodule StreamProcessor where\n\nimport Control.Monad.Trans.State.Strict -- Strict variant prevents thunk accumulation\nimport Data.Conduit\nimport qualified Data.Conduit.List as CL\n\nprocessStream :: Monad m => ConduitT Int Int (StateT Int m) ()\nprocessStream = CL.mapM $ \\x -> do\n    modify' (\\ (!s) -> s + x) -- Strict modify forces immediate evaluation\n    return x",
    "verification": "Profile memory usage using GHC runtime flags (`+RTS -hy -p`). Confirm via the generated `.hp` profile graph that the heap remains flat under sustained ingestion of 10M+ stream events.",
    "date": "2026-08-12",
    "id": 1786496790,
    "type": "error"
});