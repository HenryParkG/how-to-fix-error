window.onPostDataLoaded({
    "title": "Fixing Haskell Lazy Evaluation Space Leaks",
    "slug": "haskell-lazy-evaluation-space-leaks",
    "language": "Haskell",
    "code": "Space Leak",
    "tags": [
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Haskell, lazy evaluation means expressions are not evaluated until their results are actually needed. Instead, the runtime constructs a heap object called a 'thunk' representing the computation. In long-running daemons, if a state fold or accumulator is continually updated without being forced, the runtime accumulates massive chains of nested thunks. This causes a space leak that eventually triggers Out Of Memory (OOM) crashes.</p>",
    "root_cause": "Accumulating non-strict thunks in recursive functions or state monad updates (e.g., using `foldl` instead of strict `foldl'`), leading to a heap filled with unevaluated computation trees.",
    "bad_code": "import Control.Monad.State\n\n-- Lazy state accumulation in a daemon loop\nupdateDaemonState :: Int -> State (Int, [String]) ()\nupdateDaemonState newVal = do\n  (count, logs) <- get\n  -- Space leak: 'count + newVal' builds a thunk chain\n  put (count + newVal, show newVal : logs)",
    "solution_desc": "Enforce eager evaluation of the state accumulator using strict data structures, strict application operators like `$!`, or utilizing strict versions of monadic operations and fold functions (like `foldl'`).",
    "good_code": "{-# LANGUAGE BangPatterns #-}\nimport Control.Monad.State.Strict\n\n-- Strict state accumulation prevents thunk building\nupdateDaemonStateStrict :: Int -> State (Int, [String]) ()\nupdateDaemonStateStrict !newVal = do\n  (count, logs) <- get\n  -- The bang patterns (!) force evaluation of variables before binding\n  let !nextCount = count + newVal\n  put (nextCount, show newVal : logs)",
    "verification": "Profile the executable using GHC profiling flags: compile with `-prof -fprof-auto` and run with `+RTS -hc -p` to generate a heap profile chart (.hp file). Verify that the heap usage remains flat over time under continuous workload.",
    "date": "2026-07-08",
    "id": 1783489444,
    "type": "error"
});