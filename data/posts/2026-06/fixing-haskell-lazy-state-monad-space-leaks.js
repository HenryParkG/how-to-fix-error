window.onPostDataLoaded({
    "title": "Fixing Haskell Lazy State Monad Space Leaks",
    "slug": "fixing-haskell-lazy-state-monad-space-leaks",
    "language": "Haskell",
    "code": "OutOfMemory",
    "tags": [
        "Haskell",
        "Docker",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Haskell's non-strict evaluation makes it vulnerable to memory leaks known as space leaks. A common source is the lazy State Monad (<code>Control.Monad.State.Lazy</code>) when modifying state repeatedly inside recursive actions or loops.</p><p>Because lazy evaluation postpones actual computation until explicitly demanded, modifications to the state do not compute values. Instead, they construct a nested tower of unevaluated computations (thunks) in the heap. As the loop progresses, the heap consumption grows linearly until the runtime exhausts all system memory.</p>",
    "root_cause": "Using 'Control.Monad.State.Lazy' combined with lazy modifier functions like 'modify' or 'put' creates unevaluated thunks on the heap instead of immediate values.",
    "bad_code": "import Control.Monad.State.Lazy\n\n-- Accumulator function utilizing lazy state\nsumState :: [Int] -> State Int ()\nsumState [] = return ()\nsumState (x:xs) = do\n    modify (\\s -> s + x) -- LEAK: Lazy accumulation constructs a thunk tree\n    sumState xs",
    "solution_desc": "Swap the lazy state monad for the strict variant ('Control.Monad.State.Strict') and utilize the strict modification function ('modify\\'') to immediately force the evaluation of the accumulated state to Weak Head Normal Form (WHNF).",
    "good_code": "import Control.Monad.State.Strict\n\n-- Accumulator function utilizing strict state and strict modification\nsumState :: [Int] -> State Int ()\nsumState [] = return ()\nsumState (x:xs) = do\n    modify' (\\s -> s + x) -- FIX: Strict evaluation forces calculation immediately\n    sumState xs",
    "verification": "Compile with GHC flags '-prof -fprof-auto', execute with profiling RTS flags ('+RTS -hc -p'), and inspect the resulting '.hp' heap profile using 'hp2ps' to confirm flat memory allocation usage.",
    "date": "2026-06-13",
    "id": 1781317946,
    "type": "error"
});