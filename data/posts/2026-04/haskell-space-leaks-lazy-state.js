window.onPostDataLoaded({
    "title": "Resolving Haskell Space Leaks in Lazy State Monads",
    "slug": "haskell-space-leaks-lazy-state",
    "language": "Haskell",
    "code": "Memory Leak",
    "tags": [
        "Backend",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>In Haskell, space leaks frequently occur when using the Lazy version of the State Monad. Because Haskell is lazy by default, the state transformation `s -> (a, s)` doesn't evaluate the new state immediately. Instead, it builds a massive chain of unevaluated expressions (thunks) in the heap. As the program runs, these thunks consume memory until a 'Stack Overflow' or 'Out of Memory' error occurs when the state is finally forced.</p>",
    "root_cause": "Accumulation of unevaluated thunks in the state field due to using Control.Monad.State.Lazy instead of the Strict variant.",
    "bad_code": "import Control.Monad.State\n\n-- Lazy state accumulation\nsumList :: [Int] -> State Int ()\nsumList = mapM_ (\\x -> modify (+x))\n\n-- Running this on a large list causes a space leak\nmain = print $ execState (sumList [1..1000000]) 0",
    "solution_desc": "Switch to the Strict version of the State monad and ensure that the state value itself is evaluated to Weak Head Normal Form (WHNF) at each step using bang patterns or 'seq'.",
    "good_code": "import qualified Control.Monad.State.Strict as S\n\n-- Strict state accumulation with bang pattern\nsumListStrict :: [Int] -> S.State Int ()\nsumListStrict = mapM_ (\\x -> S.modify' (+x))\n\n-- modify' uses strict evaluation\nmain = print $ S.execState (sumListStrict [1..1000000]) 0",
    "verification": "Profile the heap usage using `ghc -prof -fprof-auto -rtsopts` and run with `+RTS -hc`. The resulting chart should show constant memory usage rather than a linear increase.",
    "date": "2026-04-14",
    "id": 1776143747,
    "type": "error"
});