window.onPostDataLoaded({
    "title": "Eliminating Haskell Space Leaks in Monad Transformers",
    "slug": "haskell-monad-transformer-space-leaks",
    "language": "Haskell",
    "code": "SpaceLeak",
    "tags": [
        "Haskell",
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In Haskell, space leaks frequently occur when using lazy monad transformers like <code>StateT</code> or <code>WriterT</code>. These leaks stem from the deferred evaluation of the internal state, creating a chain of thunks (unevaluated expressions) in memory. As the computation progresses through a large loop or recursive call, the heap grows linearly with the number of iterations, eventually causing an Out-Of-Memory (OOM) error or severe GC pressure.</p>",
    "root_cause": "The lazy version of StateT accumulates thunks in the state tuple because the recursive step does not force the evaluation of the new state before the next iteration.",
    "bad_code": "import Control.Monad.State.Lazy\n\nleakyCounter :: Int -> State Int ()\nleakyCounter 0 = return ()\nleakyCounter n = modify (+1) >> leakyCounter (n-1)\n\n-- runState (leakyCounter 1000000) 0 will build 1M thunks.",
    "solution_desc": "Switch to the strict version of the State transformer and use the strict modification function (modify') which forces the evaluation of the state to Weak Head Normal Form (WHNF) at each step.",
    "good_code": "import Control.Monad.State.Strict\n\nstableCounter :: Int -> State Int ()\nstableCounter 0 = return ()\nstableCounter n = modify' (+1) >> stableCounter (n-1)\n\n-- runState (stableCounter 1000000) 0 executes in constant space.",
    "verification": "Compile with -prof -fprof-auto and run with +RTS -hc to generate a heap profile. Constant heap usage confirms the fix.",
    "date": "2026-05-01",
    "id": 1777615206,
    "type": "error"
});