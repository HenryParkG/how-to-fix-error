window.onPostDataLoaded({
    "title": "Identifying Haskell Thunk Leaks in Streaming",
    "slug": "haskell-thunk-leak-streaming-fix",
    "language": "Haskell",
    "code": "MemoryLeak",
    "tags": [
        "Backend",
        "Rust",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's lazy evaluation is powerful but dangerous in high-concurrency streaming pipelines (e.g., using Conduit or Pipes). A thunk leak occurs when a stateful transformation accumulates unevaluated expressions (thunks) in memory instead of reducing them to values. In a streaming context, this causes memory usage to grow linearly with the number of processed items, eventually leading to an OOM (Out of Memory) crash or excessive GC pressure.</p>",
    "root_cause": "The use of lazy state containers or lazy folds (like `foldl`) within a streaming loop. The runtime stores the calculation 'recipe' rather than the result, creating a chain of references that cannot be garbage collected.",
    "bad_code": "import Data.Conduit\nimport qualified Data.Conduit.List as CL\n\n-- Lazy accumulator in a stream\nsumStream = CL.sourceList [1..1000000] $$ CL.fold (\\acc x -> acc + x) 0",
    "solution_desc": "Force strict evaluation at each step of the pipeline. Use strict variants of folds (e.g., `foldl'`) and apply BangPatterns (`!`) to data constructors or function arguments to ensure that values are reduced to Weak Head Normal Form (WHNF) immediately.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nimport Data.Conduit\nimport qualified Data.Conduit.List as CL\nimport Data.List (foldl')\n\n-- Use CL.fold' (strict version) or manual strictness\nsumStreamStrict = CL.sourceList [1..1000000] $$ CL.fold' (\\acc x -> \n    let !next = acc + x in next) 0",
    "verification": "Profile the application using GHC's heap profiling: `ghc -prof -fprof-auto -rtsopts` and run with `+RTS -hc`. Check the `.hp` file to ensure the 'Stale' or 'Thunk' memory categories are not growing.",
    "date": "2026-02-17",
    "id": 1771303691,
    "type": "error"
});