window.onPostDataLoaded({
    "title": "Fixing Haskell Space Leaks & Thunk Accumulation",
    "slug": "haskell-lazy-evaluation-thunk-space-leak-fix",
    "language": "Haskell",
    "code": "OutOfMemory: ThunkAccumulation",
    "tags": [
        "Rust",
        "Python",
        "Docker",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's default non-strict (lazy) evaluation semantics defer computations by allocating thunks in heap memory. In long-running daemons, worker threads, or stream processing loops, accumulating unevaluated thunks inside recursive accumulators or state records creates severe space leaks.</p><p>Because the outer data structure is referenced, the Garbage Collector cannot reclaim thunks nested inside unforced fields. Over millions of iterations, these thunk graphs expand monotonically, causing heap bloat, constant GC thrashing, and eventual process death due to Out-Of-Memory termination.</p>",
    "root_cause": "Lazy record fields and standard non-strict fold operations accumulate unevaluated expression graphs (thunks) in long-lived stateful worker loops without forcing Weak Head Normal Form (WHNF).",
    "bad_code": "module Main where\n\nimport Control.Concurrent (threadDelay)\nimport Control.Monad (forever)\n\ndata ServerState = ServerState {\n    totalProcessed :: Integer, -- BUG: Lazy field accumulates thunks\n    lastSeenError  :: Maybe String\n}\n\nprocessEvents :: ServerState -> [Int] -> IO ServerState\nprocessEvents state [] = pure state\nprocessEvents state (x:xs) = do\n    -- BUG: TotalProcessed builds an unevaluated thunk: (totalProcessed state) + fromIntegral x\n    let newState = state { totalProcessed = totalProcessed state + fromIntegral x }\n    processEvents newState xs\n\nmain :: IO ()\nmain = do\n    let initial = ServerState 0 Nothing\n    forever $ do\n        st <- processEvents initial [1..100000]\n        threadDelay 1000000",
    "solution_desc": "Enforce strictness by adding strict data field annotations (`!`), using `BangPatterns`, or applying `$!` / `seq` / `deepseq` in iterative steps. Use strict state monads (`Control.Monad.Trans.State.Strict`) to guarantee thunk evaluation to WHNF or Normal Form during state transitions.",
    "good_code": "{-# LANGUAGE BangPatterns #-}\n{-# LANGUAGE StrictData #-}\n\nmodule Main where\n\nimport Control.Concurrent (threadDelay)\nimport Control.Monad (forever)\nimport Control.DeepSeq (NFData, deepseq)\nimport GHC.Generics (Generic)\n\ndata ServerState = ServerState {\n    totalProcessed :: !Integer,\n    lastSeenError  :: !(Maybe String)\n} deriving (Show, Generic)\n\ninstance NFData ServerState\n\nprocessEvents :: ServerState -> [Int] -> IO ServerState\nprocessEvents !state [] = pure state\nprocessEvents !state (x:xs) = do\n    -- Force strict evaluation of the accumulated arithmetic before recursive call\n    let !newCount = totalProcessed state + fromIntegral x\n    let !newState = state { totalProcessed = newCount }\n    processEvents newState xs\n\nmain :: IO ()\nmain = do\n    let initial = ServerState 0 Nothing\n    forever $ do\n        !st <- processEvents initial [1..100000]\n        threadDelay 1000000",
    "verification": "Compile with `ghc -O2 -prof -fprof-auto -rtsopts Main.hs` and run with `./Main +RTS -hy -p -RTS`. Generate profiling graph with `hp2ps -e8in -c Main.hp` and verify constant memory usage without saw-tooth thunk cliffs.",
    "date": "2026-08-21",
    "id": 1787304771,
    "type": "error"
});