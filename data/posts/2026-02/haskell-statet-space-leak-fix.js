window.onPostDataLoaded({
    "title": "Fix Haskell Space Leaks in State Monad Transformers",
    "slug": "haskell-statet-space-leak-fix",
    "language": "Haskell",
    "code": "MemoryLeak",
    "tags": [
        "Rust",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In long-running Haskell applications, use of the lazy StateT transformer often leads to massive memory consumption. This occurs because the state updates are not evaluated immediately, but are instead stored as a chain of thunks (unevaluated expressions) in memory.</p><p>As the application runs, this chain grows indefinitely. When the state is finally demanded, the program may crash with a Stack Overflow or exhaust system RAM while trying to evaluate the massive nested expression.</p>",
    "root_cause": "The default State transformer in Control.Monad.State is lazy in the state. Even if the Monad itself is strict, the value being stored in the state remains unevaluated unless explicitly forced, leading to thunk build-up.",
    "bad_code": "import Control.Monad.State\n\n-- Lazy state modification builds thunks\nrunTask :: StateT Int IO ()\nrunTask = do\n    modify (+ 1) -- This builds a thunk: ((0 + 1) + 1)...\n    runTask",
    "solution_desc": "Switch to the strict version of the State transformer and use the strict modification function (modify'). For complex data types, ensure the state is forced to Normal Form using DeepSeq.",
    "good_code": "import Control.Monad.State.Strict\nimport Control.DeepSeq\n\n-- Use strict modify' and force evaluation\nrunTask :: StateT Int IO ()\nrunTask = do\n    modify' (+ 1) -- Evaluates immediately\n    runTask",
    "verification": "Monitor memory usage using GHC profiling (+RTS -hc). The heap graph should show a flat line instead of a linear growth (sawtooth pattern).",
    "date": "2026-02-21",
    "id": 1771665722,
    "type": "error"
});